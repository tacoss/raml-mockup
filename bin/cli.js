#!/usr/bin/env node

'use strict';

var fs = require('fs'),
    minimist = require('minimist'),
    cli_colors = require('cli-color-tty');

var colors = cli_colors(typeof process.stdout.isTTY !== 'undefined' ? process.stdout.isTTY : true);

var argv = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'version',
    s: 'statuses',
    d: 'directory',
    f: 'fakeroot',
    r: 'formats',
    q: 'silent',
    w: 'watch',
    p: 'port'
  },
  string: ['port', 'statuses', 'formats', 'fakeroot', 'directory'],
  boolean: ['help', 'silent', 'watch', 'version']
});

var exit = process.exit.bind(process);

function isFile(filepath) {
  return fs.existsSync(filepath) && fs.statSync(filepath).isFile();
}

function format(message) {
  return message.replace(/<(\w+)(?::(\d+))?>([^<>]+)<\/\1>/g, function(matches, color, max, str) {
    if (max > 0) {
      str = (str + (new Array(+max + 1)).join(' ')).substr(0, max);
    }

    return colors[color](str);
  });
}

function writeln(message, error) {
  if (error) {
    process.stderr.write(message + '\n');
  } else {
    process.stdout.write(format(message) + '\n');
  }
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
  message.push('  -w, --watch      Enable file watching/reloading the mock-server');
  message.push('  -q, --silent     Disable the output reporting through the STDOUT');
  message.push('  -r, --formats    Require CommonJS-module for custom format generators');
  message.push('  -f, --fakeroot   Used to resolve $ref\'s using a directory as absolute URI');
  message.push('  -d, --directory  Used with the --fakeroot option for resoving $ref\'s');
  message.push('  -s, --statuses   Override statusCode(s) for all matching resources');
  message.push('  -v, --version    Show the current version');
  message.push('  -h, --help       Display this help');

  return message.join('\n');
}

function glob(dir) {
  return dir.replace(/[\\\/]+$/, '') + '/**/*';
}

function log(message) {
  process.stdout.write(format(message));
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

  var start = function(next) {
    mock_server({
      log: log,
      raml: file,
      port: argv.port,
      silent: argv.silent,
      formats: argv.formats,
      statuses: argv.statuses,
      fakeroot: argv.fakeroot,
      directory: argv.directory
    }, function(err, close) {
      if (err) {
        writeln(err, true);
        exit(1);
      }

      next(close);
    });
  };

  if (argv.watch) {
    var gaze = require('gaze'),
        path = require('path');

    var src = [path.dirname(file) + '/**/*'];

    if (argv.formats) {
      if (!isFile(argv.formats)) {
        src.push(glob(argv.formats));
      } else {
        src.push(argv.formats);
      }
    }

    if (argv.directory) {
      src.push(glob(argv.directory));
    }

    src = src.map(function(v) {
      return path.resolve(v);
    });

    gaze(src, function(err) {
      var stop;

      if (err) {
        writeln(err, true);
        exit(1);
      }

      var reload = function() {
        if (stop) {
          stop();
        }

        start(function(close) {
          stop = close;
        });
      };

      this.on('all', function(evt, filepath) {
        writeln('\n<blueBright>File ' + filepath.replace(process.cwd() + '/', '') + ' ' + evt + ', reloading...</blueBright>\n');
        reload();
      });

      reload();
      writeln('Watching for changes...');
    });
  } else {
    start(function() {
      writeln('Listening for requests...');
    });
  }
}
