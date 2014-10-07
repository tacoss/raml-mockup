var _ = require('lodash'),
    $ = require('jsonpointer');

function reduce(schema, refs) {
  var obj = {};

  if (!schema) {
    return;
  }

  if (Array.isArray(schema)) {
    return schema;
  }

  _.each(schema, function (value, key) {
    if ('$ref' === key && 'string' === typeof value) {
      var base = value.split('#')[0];

      if (!refs[base]) {
        refs[base] = {};
      }

      delete refs[base]['$schema'];

      if (value.indexOf('#') > -1) {
        obj = reduce($.get(refs[base], value.split('#')[1]), refs);
      } else {
        obj = reduce(refs[base], refs);
      }
    } else if ('object' === typeof value) {
      obj[key] = reduce(value, refs);
    } else {
      obj[key] = value;
    }
  });

  return obj;
}

module.exports = function(schema, refs) {
  return reduce(schema, refs);
};
