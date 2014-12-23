RAML Mock-ups!
==============

[![Build Status](https://travis-ci.org/gextech/raml-mockup.png?branch=master)](https://travis-ci.org/gextech/raml-mockup) [![NPM version](https://badge.fury.io/js/raml-mockup.png)](http://badge.fury.io/js/raml-mockup) [![Coverage Status](https://coveralls.io/repos/gextech/raml-mockup/badge.png?branch=master)](https://coveralls.io/r/gextech/raml-mockup?branch=master)

Install `raml-mockup` globally:

```bash
$ npm install -g raml-mockup
```

Then starts a mock-server from your RAML:

```bash
$ raml-mockup src/api.raml -d src/schemas -f http://json-schema.org -r src/formats.js -p 5000 -w
```

Now you can make requests through the mocked-API:

```bash
$ http http://localhost:5000/path/to/resource
```

The better if you're using [httpie](https://github.com/jakubroztocil/httpie).

Options
-------

- **directory** &mdash; Used with `--fakeroot` to resolve _faked_ references through this directory.
- **fakeroot** &mdash; BaseURI for references that will fake (i.e. `http://json-schema.org`).
- **formats** &mdash; CommonJS module-id or path for custom formats.
- **silent** &mdash; Turns off the reporting through the STDOUT.
- **watch** &mdash; Enables the watch mode for mock-server.
- **port** &mdash; Custom port for mock-server.

Or just execute `raml-mockup -h` to display usage info.
