module.exports = function(name) {
  var actions = {
    help: function() { return require('./help'); },
    init: function() { return require('./init'); },
    test: function() { return require('./test'); },
    server: function() { return require('./server'); }
  };

  if (!actions[name]) {
    throw new Error('Unknown action "' + name + '"');
  }

  return actions[name]();
};
