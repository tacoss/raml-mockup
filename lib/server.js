var _ = require('lodash'),
    path = require('path');

var jsonfaker = require('json-schema-faker'),
    refaker = require('refaker');

var raml_parser = require('raml-parser'),
    express = require('express');

var extract_schemas = require('./util/extract-schemas');

module.exports = function(raml_file, params) {
  if (!params.directory) {
    params.directory = path.dirname(raml_file);
  }

  var port = params.port || process.env.PORT || 3000;

  delete params.port;

  raml_parser.loadFile(raml_file).then(function(data) {
    try {
      var raml_schemas = extract_schemas(data),
          cached_schemas = {};

      params.schemas = [];

      _.each(raml_schemas, function(obj) {
        if (obj.schema && typeof obj.schema.id === 'string' && !cached_schemas[obj.schema.id]) {
          params.schemas.push(obj.schema);
          cached_schemas[obj.schema.id] = true;
        }
      });

      _.each(data.schemas, function(obj) {
        _.each(_.map(_.values(obj), JSON.parse), function(schema) {
          if (typeof schema.id === 'string' && !cached_schemas[schema.id]) {
            params.schemas.push(schema);
            cached_schemas[schema.id] = true;
          }
        });
      });

      refaker(params, function(err, refs, schemas) {
        if (err) {
          if (err.message) {
            process.stderr.write(err.message + '\n');
          }

          process.exit(1);
        }

        var app = express(),
            fixed_schemas = {};

        _.each(schemas, function(schema) {
            fixed_schemas[schema.$offset] = schema;

            delete schema.$offset;
          });

        _.each(raml_schemas, function(resource) {
          var route = resource.request.path.replace(/\{(\w+)\}/g, ':$1'),
              fixed_schema = fixed_schemas[resource.schema.$offset];

          process.stdout.write(resource.request.method.toUpperCase() + ' ' + route + '\n');

          app.route(route)[resource.request.method](function(req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.json(fixed_schema ? jsonfaker(fixed_schema, refs) : resource.example);

            process.stdout.write(resource.request.method.toUpperCase() + ' ' + route + ' => ' + req.url + '\n');
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
