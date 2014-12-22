cmd = require('./helpers/cmd')

describe 'API service', ->
  it 'should fail on remote references (missing --fakeroot)', (done) ->
    cmd './spec/fixtures/api.raml', true, ->
      expect(cmd.stderr).toContain 'Error: cannot parse'
      done()

  it 'should fail on remote and local references (missing --directory)', (done) ->
    cmd './spec/fixtures/api.raml -f http://json-schema.org', true, ->
      expect(cmd.stderr).toContain 'Error: ENOENT, no such file or directory'
      done()

  it 'should resolve all given resources (using --fakeroot and --directory)', (done) ->
    cmd './spec/fixtures/api.raml -d ./spec/fixtures/schemas -f http://json-schema.org', true, ->
      expect(cmd.stdout).toContain '/songs/:id'
      done()

  it 'should override the port for the mock-server (using --port, --fakeroot and --directory)', (done) ->
    cmd './spec/fixtures/api.raml -d ./spec/fixtures/schemas -f http://json-schema.org -p 5000', true, ->
      expect(cmd.stdout).toContain 'Listening at port 5000'
      done()
