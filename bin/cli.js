#!/usr/bin/env node

'use strict';

var fs = require('fs'),
    minimist = require('minimist');

var argv = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'version',
    d: 'directory',
    f: 'fakeroot',
    p: 'port'
  },
  string: ['port', 'fakeroot', 'directory'],
  boolean: ['help', 'version']
});

var exit = process.exit.bind(process);

function isFile(filepath) {
  return fs.existsSync(filepath) && fs.statSync(filepath).isFile();
}

function writeln(message, error) {
  process[error ? 'stderr' : 'stdout'].write(message + '\n');
}

function usage(header) {
  var message = [];

  if (header) {
    message.push(header);
  }

  message.push('Usage:');
  message.push('  raml-mockup src/index.raml [OPTIONS]');

  message.push('Options:');
  message.push('  -p, --port       The port used for exposing the faked-api');
  message.push('  -f, --fakeroot   Used to resolve $ref\'s using a directory as absolute URI');
  message.push('  -d, --directory  Used with the --fakeroot option for resoving $ref\'s');
  message.push('  -v, --version    Show the current version');
  message.push('  -h, --help       Display this help');

  return message.join('\n');
}

if (argv.version) {
  var pkg = require('../package.json');

  writeln([pkg.name, pkg.version].join(' '));
  exit(1);
} else if (argv.help) {
  writeln(usage());
  exit(1);
} else {
  var file = argv._.shift();

  if (!file) {
    writeln(usage('Missing arguments'), true);
    exit(1);
  }

  if (!isFile(file)) {
    writeln(usage('Invalid input'), true);
    exit(1);
  }

  var mock_server = require('../lib/mock-server');

  mock_server({
    raml: file,
    port: argv.port,
    fakeroot: argv.fakeroot,
    directory: argv.directory
  }, function(err) {
    if (err) {
      writeln(err, true);
      exit(1);
    }
  });
}
