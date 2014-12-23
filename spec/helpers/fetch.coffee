http = require('http')

module.exports = (url, callback) ->
  req = http.get url, (res) ->
    body = ''

    res.on 'data', (data) ->
      body += data

    res.on 'end', ->
      callback null, body

  req.on 'error', (err) ->
    callback err
