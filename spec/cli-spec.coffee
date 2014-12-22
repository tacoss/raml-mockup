cmd = require('./helpers/cmd')

describe 'CLI options', ->
  describe 'Missing arguments', (done) ->
    beforeEach cmd

    it 'should display "Missing arguments"', ->
      expect(cmd.stderr).toContain 'Missing arguments'

    it 'should exit with 1', ->
      expect(cmd.exitStatus).toEqual 1

  describe 'Invalid RAML-file', (done) ->
    beforeEach (done) ->
      cmd './not_exists.raml', done

    it 'should display "Invalid input"', ->
      expect(cmd.stderr).toContain 'Invalid input'

    it 'should exit with 1', ->
      expect(cmd.exitStatus).toEqual 1

  describe 'Usage info', (done) ->
    beforeEach (done) ->
      cmd '-h', done

    it 'should display usage-info only', ->
      expect(cmd.stdout).toContain 'Usage:'

    it 'should exit with 1', ->
      expect(cmd.exitStatus).toEqual 1

  describe 'Version', (done) ->
    beforeEach (done) ->
      cmd '-v', done

    it 'should display the current version', ->
      expect(cmd.stdout).toMatch /raml-mockup \d+\.\d+\.\d+/

    it 'should exit with 1', ->
      expect(cmd.exitStatus).toEqual 1
