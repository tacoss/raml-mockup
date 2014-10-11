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
      var raml_schemas = extract_schemas(data);

      params.schemas = _.map(raml_schemas, function(obj) {
        return obj.schema;
      });

      refaker(params, function(err, refs) {
        if (err) {
          if (err.message) {
            process.stderr.write(err.message + '\n');
          }

          process.exit(1);
        }

        var app = express();

        _.each(raml_schemas, function(obj) {
          var route = obj.path.replace(/\{(\w+)\}/g, ':$1');

          app.route(route)[obj.method](function(req, res, next) {
            process.stdout.write(obj.method.toUpperCase() + ' ' + route + ' => ' + req.url + '\n');

            res.setHeader('Access-Control-Allow-Origin', '*');

            res.json(jsonfaker(obj.schema));
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
