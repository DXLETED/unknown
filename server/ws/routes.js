var express = require('express')
var router = express.Router()
const wsm = require('./wsm')

router.ws('/limits/', function(ws, req) {
  //connects.push(ws)
  wsm.addToGroup('limits', ws)
  ws.on('message', function(msg) {
    ws.send(msg)
  })
  send1 = msg => ws.send(msg)
  ws.on('close', () => {
    wsm.removeFromGroup('limits', ws)
  })
})

module.exports = router