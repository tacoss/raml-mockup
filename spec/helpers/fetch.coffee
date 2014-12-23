http = require('http')

build = (res, data) ->
  json: data
  status: res.statusCode

module.exports = (url, callback) ->
  req = http.get url, (res) ->
    body = ''

    res.on 'data', (data) ->
      body += data

    res.on 'end', ->
      body = try
        JSON.parse body
      catch e
        null

      callback null, build(res, body)

  req.on 'error', (err) ->
    callback err
