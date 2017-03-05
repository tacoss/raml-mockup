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
          if (!body.schemaContent) {
            body.schemaContent = (body.hasOwnProperty('type') && body.type && body.type[0]) ||
                                 (body.hasOwnProperty('schema') && body.schema && body.schema[0]);
          }

          if (body.name !== 'application/json') {
            return;
          }

          if (!retval[route][method.method]) {
            retval[route][method.method] = {};
          }

          var fixed_path = method.method.toUpperCase() + ' ' + route;
          var fixed_schema;

          if (body.schemaContent) {
            fixed_schema = body.schemaContent.charAt() === '{'
              ? parse(body.schemaContent, fixed_path)
              : body.schemaContent;
          }

          retval[route][method.method][_status] = {
            _ref: hash(),
            schema: fixed_schema || null,
            example: typeof body.example === 'string' ? parse(body.example, fixed_path) : body.example || null
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

  var _schemas = {};
  var _examples = {};

  _.each(schema.schemas || [], function(items) {
      _.each(items, function(item, key) {
        _schemas[key] = items[key];
      });
    });

  _.each(schema.types || [], function(items) {
      _.each(items, function(item) {
        _schemas[item.name] = item.type[0];
        _examples[item.name] = item.example;
      });
    });

  _.each(res, function(methods, _path) {
    var _key = [_path];

    _.each(methods, function(responses, _method) {
      _key.unshift(_method.toUpperCase());

      _.each(responses, function(body, _status) {
        _key.push(_status);

        if (typeof body.schema === 'string') {
          var schema_name = body.schema;

          body.schema = parse(_schemas[schema_name], _key.join(' ')) || null;

          if (body.example === null) {
            body.example = _examples[schema_name];
          }
        }

        if (body.schema !== null && !all[body._ref]) {
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
