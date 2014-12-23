RAML Mock-ups!
==============

[![Build Status](https://travis-ci.org/gextech/raml-mockup.png?branch=master)](https://travis-ci.org/gextech/raml-mockup) [![NPM version](https://badge.fury.io/js/raml-mockup.png)](http://badge.fury.io/js/raml-mockup) [![Coverage Status](https://coveralls.io/repos/gextech/raml-mockup/badge.png?branch=master)](https://coveralls.io/r/gextech/raml-mockup?branch=master)

Install `raml-mockup` globally:

```bash
$ npm install -g raml-mockup
```

Then starts a mock-server from your RAML:

```bash
$ raml-mockup src/api.raml --directory src/schemas --fakeroot http://json-schema.org --formats src/formats.js --port 5000 --watch
```

Now you can make requests for the mocked-API:

```bash
$ http http://localhost:5000/path/to/resource
```

The better if you're using [httpie](https://github.com/jakubroztocil/httpie).
