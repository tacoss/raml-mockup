function _loop(obj, cb) {
  if (Array.isArray(obj)) {
    return obj.map(cb);
  }

  var out = {};

  Object.keys(obj).forEach(function (key) {
    out[key] = cb(obj[key], key);
  });

  return out;
}

module.exports = {
  each: function (obj, cb) { _loop(obj, cb); },
  map: function (obj, cb) { return _loop(obj, cb); },
  omit: function (obj) {
    var keys = Array.prototype.slice.call(arguments, 1);
    var out = {};

    _loop(obj, function (value, key) {
      if (keys.indexOf(key) === -1) {
        out[key] = value;
      }
    });

    return out;
  },
  values: function (obj) {
    return _loop(obj, function (value) {
      return value;
    });
  },
  sample: function (obj) {
    return obj[Math.floor(Math.random() * obj.length)];
  }
};
