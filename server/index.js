var express = require('express')
var app = express()
const expressWs = require('express-ws')(app)

var apiRoutes = require('./api_v1/routes')
var wsRoutes = require('./ws/routes')

var send1 = () => {}

app

.use('/static/', express.static('static/'))

.use('/api/v1/', apiRoutes)

.use('/ws/', wsRoutes)

.get('*', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

.listen(80)

const livereload = require('livereload')
const lrserver = livereload.createServer()
lrserver.watch(__dirname + "/../static")
console.log(`Mode - ${app.settings.env}`)

setInterval(() => send1(JSON.stringify(limits)), 1000)