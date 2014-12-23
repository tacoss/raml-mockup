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
    if (!params.quiet) {
      flush(msg);
    }
  }

  raml_parser.loadFile(params.raml).then(function(data) {
    try {
      var api = extract(data);

      params.schemas = [];

      var push = function (schema) {
        if (params.schemas.indexOf(schema) === -1) {
          params.schemas.push(schema);
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
            var keys = Object.keys(responses);

            log('    ' + (method.toUpperCase() + ((new Array(10)).join(' '))).substr(0, 6) + ' -> ' + (keys.join(', ')) + '\n');

            app.route(route)[method](function(req, res) {
              res.setHeader('Access-Control-Allow-Origin', '*');

              try {
                res.statusCode = _.sample(keys);
                res.json(jsonfaker(api.schemas[responses[res.statusCode].schema], refs));
              } catch (e) {
                res.statusCode = 500;
                res.json({ error: e.message });
              }

              log('\n' + req.method + ' ' + route + ' => ' + req.url + ' (' + res.statusCode + ')' + '\n');
            });
          });
        });

        log('\n');

        if (params.watch) {
          log('Watching for changes...\n');
        } else {
          log('Listening for requests...\n');
        }

        app.listen(params.port, function() {
          callback(null, this.close.bind(this));
        });
      });
    } catch (e) {
      callback(e);
    }
  }, callback);
};
