var _ = require('./helpers');

var id = 0;

function hash() {
  return 'schema_' + (id++);
}

function parse(json, path) {
  try {
    return JSON.parse(json);
  } catch (e) {
    if (!json) {
      throw new Error('empty JSON string on ' + path);
    }

    throw new Error(e.message + ' on ' + path + ' (' + json + ')');
  }
}

function reduce(schema, parent) {
  var _resources = schema.resources || [];
  var retval = {};

  _.each(_resources, function(resource) {
    var parts = parent.concat([resource.relativeUri]);
    var _methods = resource.methods || [];

    _.each(_methods, function(method) {
      var _responses = method.responses || [];

      _.each(_responses, function(response) {
        var _status = response.code;
        var _body = response.body;
        var route = parts.join('');

        if (!retval[route]) {
          retval[route] = {};
        }

        _.each(_body, function(body) {
          if (body.name !== 'application/json') {
            return;
          }

          if (!retval[route][method.method]) {
            retval[route][method.method] = {};
          }

          var fixed_path = method.method.toUpperCase() + ' ' + route;
          var fixed_schema = body.schemaContent.charAt() === '{' ? parse(body.schemaContent, fixed_path) : null;

          retval[route][method.method][_status] = {
            _ref: fixed_schema === null ? body.schemaContent : hash(),
            schema: fixed_schema || {},
            example: body.example ? parse(body.example, fixed_path) : null
          };
        });
      });
    });

    if (resource.resources) {
      var re = reduce(resource, parts);

      for (var key in re) {
        retval[key] = re[key];
      }
    }
  });

  return retval;
}

module.exports = function(schema) {
  var res = reduce(schema, []),
      all = {};

  _.each(res, function(methods) {
    _.each(methods, function(responses) {
      _.each(responses, function(body) {
        if (!all[body._ref]) {
          all[body._ref] = body.schema;
          delete body.schema;
        }
      });
    });
  });

  return {
    resources: res,
    definitions: all
  };
};
