mockServer = require('../lib/mock-server')
fetch = require('./helpers/fetch')

describe 'XKCD example', ->
  killServer = null

  beforeEach (done) ->
    mockServer
      port: 9002
      silent: true
      raml: './spec/fixtures-xkcd/api.raml'
      fakeroot: 'http://json-schema.org'
      directory: './spec/fixtures-xkcd/schemas'
    , (err, stop) ->
      killServer = stop
      done()

  afterEach ->
    killServer()

  describe 'making requests', ->
    it 'should responds to /info.0.json', (done) ->
      fetch 'http://localhost:9002/info.0.json?_forceExample=true', (err, response) ->
       expect(response.json.safe_title).toEqual 'Morse Code'
       expect(response.status).toBe 200
       done()

    it 'should responds to /x/info.0.json', (done) ->
      fetch 'http://localhost:9002/x/info.0.json?_forceExample=true', (err, response) ->
       expect(response.json.safe_title).toEqual 'Morse Code'
       expect(response.status).toBe 200
       done()
