var _ = require('lodash'),
    path = require('path');

var jsonfaker = require('json-schema-faker'),
    refaker = require('refaker');

var raml_parser = require('raml-parser'),
    express = require('express');

var extract_resources = require('./util/extract-resources');

module.exports = function(raml_file, params) {
  if (!params.directory) {
    params.directory = path.dirname(raml_file);
  }

  var port = params.port || process.env.PORT || 3000;

  delete params.port;

  raml_parser.loadFile(raml_file).then(function(data) {
    try {
      var api = extract_resources(data);

      params.schemas = [];

      function push(schema) {
        if (params.schemas.indexOf(schema) === -1) {
          params.schemas.push(schema);
        }
      }

      _.each(api.schemas, push);

      _.each(data.schemas, function(obj) {
        _.each(_.map(_.values(obj), JSON.parse), push);
      });

      refaker(params, function(err, refs, schemas) {
        if (err) {
          if (err.message) {
            process.stderr.write(err.message + '\n');
          }

          process.exit(1);
        }

        var app = express();

        _.each(schemas, function(schema) {
          api.schemas[schema.$offset] = schema;
          delete api.schemas[schema.$offset].$offset;
        });

        _.each(api.resources, function(resource, path) {
          var route = path.replace(/\{(\w+)\}/g, ':$1');

          process.stdout.write(route + '\n');

          _.each(resource, function(responses, method) {
            var keys = Object.keys(responses);

            process.stdout.write('    ' + method.toUpperCase() + ' -> ' + (keys.join(', ')) + '\n');

            app.route(route)[method](function(req, res, next) {
              res.statusCode = _.sample(keys);
              res.setHeader('Access-Control-Allow-Origin', '*');

              res.json(jsonfaker(api.schemas[responses[res.statusCode].schema], refs));

              process.stdout.write(req.method + ' ' + route + ' => ' + req.url + ' (' + res.statusCode + ')' + '\n');
            });
          });
        });

        process.stdout.write('Listening at port ' + port + '\n');

        app.listen(port);
      });
    } catch (e) {
      if (e.message) {
        process.stderr.write(e.message + '\n');
      }

      process.exit(1);
    }
  }, function(err) {
    if (err.message) {
      process.stderr.write(err.message + '\n');
    }

    process.exit(1);
  });
};
