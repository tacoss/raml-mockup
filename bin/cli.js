#!/usr/bin/env node

var fs = require('fs'),
    minimist = require('minimist'),
    cli_colors = require('chalk');

var argv = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'version',
    s: 'statuses',
    d: 'directory',
    f: 'fakeroot',
    r: 'formats',
    t: 'timeout',
    q: 'silent',
    w: 'watch',
    p: 'port',
    e: 'forceExample'
  },
  string: ['port', 'statuses', 'formats', 'timeout', 'fakeroot', 'directory'],
  boolean: ['help', 'silent', 'watch', 'version', 'forceExample']
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

    return cli_colors[color](str);
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
  message.push('  -p, --port         The port used for exposing the faked-api');
  message.push('  -w, --watch        Enable file watching/reloading the mock-server');
  message.push('  -q, --silent       Disable the output reporting through the STDOUT');
  message.push('  -r, --formats      Require CommonJS-module for custom format generators');
  message.push('  -f, --fakeroot     Used to resolve $ref\'s using a directory as absolute URI');
  message.push('  -d, --directory    Used with the --fakeroot option for resoving $ref\'s');
  message.push('  -s, --statuses     Override statusCode(s) for all matching resources');
  message.push('  -e, --forceExample Always return example, if available');
  message.push('  -v, --version      Show the current version');
  message.push('  -h, --help         Display this help');

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
      timeout: argv.timeout,
      statuses: argv.statuses,
      fakeroot: argv.fakeroot,
      directory: argv.directory,
      forceExample: argv.forceExample
    }, function(err, close) {
      if (err) {
        writeln(err, true);
        exit(1);
      }

      next(close);
    });
  };

  if (argv.watch) {
    var chokidar = require('chokidar'),
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

    var stop;

    function reload(ms, evt, file) {
      var next;

      if (typeof ms === 'function') {
        next = ms;
        ms = 0;
      }

      clearTimeout(reload._t);

      reload._t = setTimeout(function () {
        if (evt && file) {
          writeln('<gray>File ' + evt + ': '
            + path.relative(process.cwd(), file) + ', reloading...</gray>');
        }

        if (stop) {
          stop();
        }

        start(function(close) {
          if (typeof next === 'function') {
            next();
          }

          stop = close;
        });
      }, ms);
    }

    chokidar.watch(src, {
      persistent: true,
      ignoreInitial: true
    }).on('all', function(evt, file) {
      switch (evt) {
        case 'add':
        case 'change':
        case 'unlink':
          reload(200, evt, file);
        break;
      }
    }).on('error', function(e) {
      writeln(e, true);
      exit(1);
    });

    reload(function () {
      writeln('<gray>Watching for changes...</gray>');
    });
  } else {
    start(function() {
      writeln('<gray>Listening for requests...</gray>');
    });
  }
}
