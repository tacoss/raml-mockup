var _ = require('lodash');

function parse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error(e.message + '(' + json + ')'); "#{e} (#{json})"
  }
}

function reduce(schema, parent) {
  var retval = [];

  if (!schema.resources) {
    return retval;
  }

  _.each(schema.resources, function(resource) {
    var parts = parent.concat([resource.relativeUri]);

    if (!(resource && resource.methods)) {
      return;
    }

    _.each(resource.methods, function(method) {
      if (!(method && method.responses)) {
        return;
      }

      _.each(method.responses, function(response, status) {
        if (!(response && response.body)) {
          return;
        }

        _.each(response.body, function(body, type) {
          if (!(body && ('application/json' === type))) {
            return;
          }

          retval.push({
            path: parts.join(''),
            method: method.method,
            schema: parse(body.schema),
            example: body.example ? parse(body.example) : null
          });
        });
      });
    });

    if (resource.resources) {
      retval = retval.concat(reduce(resource, parts));
    }
  });

  return retval;
}

module.exports = function(schema) {
  return reduce(schema, []);
};
