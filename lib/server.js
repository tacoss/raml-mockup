var _ = require('lodash'),
    path = require('path');

var jsonfaker = require('json-schema-faker'),
    refaker = require('refaker'),
    deref = require('deref');

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
      var raml_schemas = extract_schemas(data);

      params.schemas = _.map(raml_schemas, function(obj) {
        return obj.schema;
      });

      refaker(params, function(err, refs, schemas) {
        if (err) {
          if (err.message) {
            process.stderr.write(err.message + '\n');
          }

          process.exit(1);
        }

        var $ = deref(),
            app = express();

        $.refs = refs;

        _.each(schemas, function(obj, key) {
          var schema = $(obj, true),
              resource = raml_schemas[key];

          var route = resource.path.replace(/\{(\w+)\}/g, ':$1');

          process.stdout.write(resource.method.toUpperCase() + ' ' + route + '\n');

          app.route(route)[resource.method](function(req, res, next) {
            process.stdout.write(resource.method.toUpperCase() + ' ' + route + ' => ' + req.url + '\n');

            res.setHeader('Access-Control-Allow-Origin', '*');

            res.json(jsonfaker(schema));
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
