var _ = require('lodash'),
    path = require('path'),
    Ramlev = require('ramlev');

module.exports = function(raml_file, params) {
  if (!params.directory) {
    params.directory = path.dirname(raml_file);
  }

  var ramlev = new Ramlev({
    options: params,
    ramlPath: raml_file
  });

  ramlev.run(function(err, stats) {
    if (err) {
      if (err.message) {
        process.stderr.write(err.message + '\n');
      }

      process.exit(1);
    }

    if (stats.failures > 0) {
      process.exit(1);
    }
  });
};
