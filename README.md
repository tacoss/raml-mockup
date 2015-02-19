RAML Mock-ups!
==============

[![Build Status](https://travis-ci.org/gextech/raml-mockup.png?branch=master)](https://travis-ci.org/gextech/raml-mockup) [![NPM version](https://badge.fury.io/js/raml-mockup.png)](http://badge.fury.io/js/raml-mockup) [![Coverage Status](https://coveralls.io/repos/gextech/raml-mockup/badge.png?branch=master)](https://coveralls.io/r/gextech/raml-mockup?branch=master)

Features
--------

- Uses `json-schema-faker` for accurate mocked responses.
- Uses `refaker` for resolving remote/local $refs.
- It's fully tested and coveraged.
- Has watch mode built-in.

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

- `--directory` &rarr; Used with `--fakeroot` to resolve _faked_ references through this directory.
- `--fakeroot` &rarr; BaseURI for references that will fake (i.e. `http://json-schema.org`).
- `--statuses` &rarr; Use custom statusCode(s) for all matched resources.
- `--formats` &rarr; CommonJS module-id or path for custom formats.
- `--silent` &rarr; Turns off the reporting through the STDOUT.
- `--watch` &rarr; Enables the watch mode for mock-server.
- `--port` &rarr; Custom port for mock-server.

Run `raml-mockup -h` to display all usage info.

queryParams
-----------

Use the following options for custom responses:

- `_statusCode=200` &rarr; Force a specific statusCode if its available.
- `_forceExample=true` &rarr; Force defined resource-example if its available.

Issues?
-------

Please open a ticket or feel free for contributing.
