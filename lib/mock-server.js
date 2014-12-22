'use strict';

var jsonfaker = require('json-schema-faker'),
    raml_parser = require('raml-parser'),
    refaker = require('refaker');

var _ = require('lodash'),
    path = require('path'),
    express = require('express');

var extract = require('./util/extract');

module.exports = function(params, callback) {
  if (!params.directory) {
    params.directory = path.dirname(params.raml);
  }

  if (!params.port) {
    params.port = process.env.PORT || 3000;
  }

  if (params.formats) {
    try {
      var formats = require(params.formats);

      jsonfaker.formats(formats);
      process.stdout.write('Using formats: ' + Object.keys(formats).join(', ') + '\n');
    } catch (e) {
      return callback(e);
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

        var app = express();

        _.each(schemas, function(schema) {
          api.schemas[schema.$offset] = schema;
          delete api.schemas[schema.$offset].$offset;
        });

        process.stdout.write('Defined resources: \n');

        _.each(api.resources, function(resource, path) {
          var route = path.replace(/\{(\w+)\}/g, ':$1');

          process.stdout.write('  ' + route + '\n');

          _.each(resource, function(responses, method) {
            var keys = Object.keys(responses);

            process.stdout.write('    ' + (method.toUpperCase() + ((new Array(10)).join(' '))).substr(0, 6) + ' -> ' + (keys.join(', ')) + '\n');

            app.route(route)[method](function(req, res) {
              res.statusCode = _.sample(keys);
              res.setHeader('Access-Control-Allow-Origin', '*');

              res.json(jsonfaker(api.schemas[responses[res.statusCode].schema], refs));

              process.stdout.write(req.method + ' ' + route + ' => ' + req.url + ' (' + res.statusCode + ')' + '\n');
            });
          });
        });

        process.stdout.write('Listening at port ' + params.port + '\n');

        app.listen(params.port);

        callback();
      });
    } catch (e) {
      callback(e);
    }
  }, callback);
};
