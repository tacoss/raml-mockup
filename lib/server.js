var _ = require('lodash'),
    path = require('path');

var raml = require('raml-parser'),
    refaker = require('refaker');

var express = require('express');

var extractSchemas = require('./util/extract-schemas'),
    combineReferences = require('./util/combine-references');

module.exports = function(raml_file, params) {
  if (!params.directory) {
    params.directory = path.dirname(raml_file);
  }

  var port = params.port || process.env.PORT || 3000;

  delete params.port;

  raml.loadFile(raml_file).then(function(data) {
    try {
      var raml_schemas = extractSchemas(data);

      refaker(_.merge({ schemas: _.map(raml_schemas, function(obj) { return obj.schema; }) }, params), function(err, refs) {
        if (err) {
          if (err.message) {
            process.stderr.write(err.message + '\n');
          }

          process.exit(1);
        }

        var app = express();

        _.each(raml_schemas, function(obj) {
          var route = obj.path.replace(/\{(\w+)\}/g, ':$1');

          // combineReferences(obj.schema, refs)
          app.route(route)[obj.method](function(req, res, next) {
            process.stdout.write(obj.method.toUpperCase() + ' ' + route + ' => ' + req.url + '\n');

            res.setHeader('Access-Control-Allow-Origin', '*');

            res.json(obj.example);
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
