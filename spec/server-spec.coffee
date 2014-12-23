mockServer = require('../lib/mock-server')
fetch = require('./helpers/fetch')

describe 'Mocking server', ->
  hasError = null
  killServer = null

  beforeEach (done) ->
    mockServer
      port: 9002
      silent: true
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
      fetch 'http://localhost:9002/songs/1', (err, response) ->
       expect(response.json).toEqual title: 'my value'
       expect(response.status).toBe 200
       done()

    it 'should fail quietly if the mocked resource is missing', (done) ->
      fetch 'http://localhost:9002/not_exists', (err, response) ->
        expect(response.json).toEqual error: 'Missing resource for /not_exists'
        expect(response.status).toBe 500
        done()

    it 'should responds the given statusCode for the requested resource', (done) ->
      fetch 'http://localhost:9002/artists/someone?_statusCode=404', (err, response) ->
        expect(response.status).toEqual 404
        done()

    it 'should responds the example for the requested resource if specified', (done) ->
      fetch 'http://localhost:9002/artists/someone_else?_forceExample=true&_statusCode=200', (err, response) ->
        expect(response.json.firstName).toEqual 'John Doe'
        expect(response.status).toEqual 200
        done()
