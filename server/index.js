var express = require('express')
var app = express()
const assert = require('assert')
const expressWs = require('express-ws')(app)
const session = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cbtKey = require('./constants/key')
const mongoose = require('mongoose')
const cron = require('node-cron')
const MongoClient = require('mongodb').MongoClient
let db

mongoose.connect('mongodb://localhost/users', {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set('debug', true)
require('./models/Users')
require('./config/passport')
const store = require('./store')

;(async () => {
  const client = await MongoClient.connect('mongodb://localhost:27017', {useUnifiedTopology: true})
  require('./db').set(client.db('test'), client)
  db = require('./db')()
  store.dispatch({type: 'UPDATE_RIOTAPIKEY', data: (await db.collection('config').findOne({key: 'riotapi_key'})).value})

  app

  .use(require('cors')())
  .use(require('morgan')('dev', {skip: (req, res) => req.originalUrl.startsWith('/static')}))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cookieParser())
  .use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }))

  .use('/static/', express.static('static/'))

  .use('/api/v1/', require('./api_v1'))

  .use('/ws/', require('./ws'))

  .get('*', function (req, res) {
    if (req.cookies.cbtKey === cbtKey)
      res.sendFile(__dirname + '/index.html')
    else
      res.sendFile(__dirname + '/closed.html')
  })

  .listen(80)
})()

cron.schedule('0 6 * * *', () => {
  console.log('br')
}, {timezone: "Europe/London"})

cron.schedule('0 6 * * *', () => {
  console.log('eune')
}, {timezone: "Europe/Helsinki"})

cron.schedule('0 6 * * *', () => {
  console.log('euw')
}, {timezone: "Europe/Paris"})

cron.schedule('0 6 * * *', () => {
  console.log('jp')
}, {timezone: "Asia/Tokyo"})

cron.schedule('0 6 * * *', () => {
  console.log('kr')
}, {timezone: "Asia/Seoul"})

cron.schedule('0 6 * * *', () => {
  console.log('lan')
}, {timezone: "America/Mexico_City"})

cron.schedule('0 6 * * *', () => {
  console.log('las')
}, {timezone: "America/Santiago"})

cron.schedule('0 6 * * *', () => {
  console.log('na')
}, {timezone: "America/Los_Angeles"})

cron.schedule('0 6 * * *', () => {
  console.log('oce')
}, {timezone: "Australia/Sydney"})

cron.schedule('0 6 * * *', () => {
  console.log('tr')
}, {timezone: "Europe/Istanbul"})

cron.schedule('0 6 * * *', () => {
  console.log('ru')
}, {timezone: "Europe/Moscow"})

const livereload = require('livereload')
const lrserver = livereload.createServer()
lrserver.watch(__dirname + "/../static")
console.log(`Mode - ${app.settings.env}`)