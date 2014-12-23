exec = require('child_process').exec

execCommand = (cmd, callback) ->
  execCommand.stderr = ''
  execCommand.stdout = ''
  execCommand.exitStatus = null

  cli = ['./bin/cli.js']

  if typeof cmd is 'function'
    callback = cmd
  else
    cli.push cmd

  cli = exec cli.join(' '), (error, out, err) ->
    execCommand.stdout = out
    execCommand.stderr = err
    execCommand.exitStatus = error.code if error

  exitEventName = if process.version.split('.')[1] is '6' then 'exit' else 'close'

  cli.on exitEventName, (code) ->
    execCommand.exitStatus = code
    callback()

module.exports = execCommand
