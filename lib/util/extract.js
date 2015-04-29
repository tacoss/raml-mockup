'use strict';

var _ = require('lodash');

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
  var retval = {};

  if (!schema.resources) {
    return retval;
  }

  _.each(schema.resources, function(resource) {
    var parts = parent.concat([resource.relativeUri]);

    if (!resource) {
      return;
    }

    var methods = resource && resource.methods || [];

    _.each(methods, function(method) {
      if (!(method && method.responses)) {
        return;
      }

      _.each(method.responses, function(response, status) {
        if (!(response && response.body)) {
          return;
        }

        var route = parts.join('');

        if (!retval[route]) {
          retval[route] = {};
        }

        _.each(response.body, function(body, type) {
          if (!(body && (type === 'application/json'))) {
            return;
          }

          if (!retval[route][method.method]) {
            retval[route][method.method] = {};
          }

          // TODO: csonschema?
          var fixed_path = method.method.toUpperCase() + ' ' + route,
              schema = parse(body.schema, fixed_path) || {};

          schema.$offset = hash();

          retval[route][method.method][status] = {
            schema: schema,
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
        if (!all[body.schema]) {
          var key = body.schema.$offset;

          all[key] = body.schema;

          body.schema = key;
        }
      });
    });
  });

  return {
    schemas: all,
    resources: res
  };
};
