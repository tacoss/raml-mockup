var _ = require('lodash');

var id = 0;

function hash() {
  return 'schema_' + (id++);
}

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

          var schema = parse(body.schema);

          schema.$offset = hash();

          retval.push({
            schema: schema,
            example: body.example ? parse(body.example) : {},
            request: {
              path: parts.join(''),
              status: status,
              method: method.method
            }
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
