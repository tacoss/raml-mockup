#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    d: 'directory',
    f: 'fakeroot',
    v: 'version',
    h: 'help',
    p: 'port'
  },
  string: ['port', 'directory', 'fakeroot'],
  boolean: ['help', 'version']
});

var actions = require('../lib'),
    params = {};

for (var key in argv) {
  if (key.length > 1 && 'string' === typeof argv[key]) {
    params[key] = argv[key];
  }
}

var cmd  = argv._.shift(),
    input = argv._.shift();

if ('start' === cmd) {
  actions('server')(input, params);
} else if ('test' === cmd) {
  actions('test')(input, params);
} else if ('init' === cmd) {
  actions('init')(input, params);
} else {
  actions('help')();
}
