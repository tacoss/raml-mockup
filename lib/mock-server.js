'use strict';

var jsonfaker = require('json-schema-faker'),
    raml_parser = require('raml-parser'),
    refaker = require('refaker');

var _ = require('lodash'),
    path = require('path'),
    express = require('express');

var extract = require('./util/extract');

function flush(message) {
  process.stdout.write(message);
}

module.exports = function(params, callback) {
  if (!params.directory) {
    params.directory = path.dirname(params.raml);
  }

  if (!params.port) {
    params.port = process.env.PORT || 3000;
  }

  if (params.formats) {
    try {
      jsonfaker.formats(require(params.formats));
    } catch (e) {
      return callback(e);
    }
  }

  function log(msg) {
    if (!params.silent) {
      flush(msg);
    }
  }

  raml_parser.loadFile(params.raml).then(function(data) {
    try {
      var tmp = [],
          api = extract(data);

      params.schemas = [];

      var push = function (schema) {
        var json = JSON.stringify(_.omit(schema, '$offset'));

        if (tmp.indexOf(json) === -1) {
          params.schemas.push(schema);
          tmp.push(json);
        }
      };

      _.each(api.schemas, push);

      _.each(data.schemas, function(obj) {
        _.each(_.map(_.values(obj), JSON.parse), push);
      });

      refaker(params, function(err, refs, schemas) {
        if (err) {
          return callback(err);
        }

        var app = express(),
            base = 'http://localhost:' + params.port;

        _.each(schemas, function(schema) {
          api.schemas[schema.$offset] = schema;
          delete api.schemas[schema.$offset].$offset;
        });

        log('Resources:\n');

        _.each(api.resources, function(resource, path) {
          var route = path.replace(/\{(\w+)\}/g, ':$1');

          log('  ' + base + route + '\n');

          _.each(resource, function(responses, method) {
            var keys = params.status ? params.status.split(',') : Object.keys(responses);

            log('    ' + (method.toUpperCase() + ((new Array(6)).join(' '))).substr(0, 6) + ' -> ' + (keys.join(', ')) + '\n');

            app.route(route)[method](function(req, res) {
              res.setHeader('Access-Control-Allow-Origin', '*');

              var reqStatus = req.query._statusCode || _.sample(keys),
                  reqExample = req.query._forceExample === 'true';

              try {
                if (keys.indexOf(reqStatus) === -1) {
                  throw new Error('Missing response for ' + req.url + ' (' + reqStatus + ')');
                }

                var sample = reqExample ? responses[reqStatus].example : false;

                if (!reqExample) {
                  sample = jsonfaker(api.schemas[responses[reqStatus].schema], refs);
                } else if (!sample) {
                  throw new Error('Missing example for ' + req.url + ' (' + reqStatus + ')');
                }

                res.statusCode = reqStatus;
                res.json(sample);
              } catch (e) {
                res.statusCode = 500;
                res.json({ error: e.message });
              }

              log('\n' + req.method + ' ' + route + ' => ' + req.url + ' (' + reqStatus + ')' + '\n');
            });
          });
        });

        log('\n');

        if (params.watch) {
          log('Watching for changes...\n');
        } else {
          log('Listening for requests...\n');
        }

        app.use(function(req, res) {
          res.statusCode = 500;
          res.json({ error: 'Missing resource for ' + req.url });
        });

        app.listen(params.port, function() {
          callback(null, this.close.bind(this));
        });
      });
    } catch (e) {
      callback(e);
    }
  }, callback);
};
