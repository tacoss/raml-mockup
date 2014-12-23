mockServer = require('../lib/mock-server')
fetch = require('./helpers/fetch')

describe 'Mocking server', ->
  hasError = null
  killServer = null

  beforeEach (done) ->
    mockServer
      port: 9002
      quiet: true
      raml: './spec/fixtures/api.raml'
      formats: __dirname + '/formats'
      fakeroot: 'http://json-schema.org'
      directory: './spec/fixtures/schemas'
    , (err, stop) ->
      killServer = stop
      hasError = err
      done()

  afterEach ->
    killServer()

  describe 'starting up', ->
    it 'should start without errors', ->
      expect(hasError).toBeNull()

    it 'should expose the stop() callback', ->
      expect(typeof killServer).toBe 'function'

  describe 'making requests', ->
    it 'should responds according the mocked resource', (done) ->
      fetch 'http://localhost:9002/songs/1', (err, data) ->
       expect(data).toEqual title: 'my value'
       done()

    it 'should fail quietly if the mocked resource is missing', (done) ->
      fetch 'http://localhost:9002/not_exists', (err, data) ->
        expect(data).toEqual error: 'Missing resource for /not_exists'
        done()
