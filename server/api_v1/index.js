var express = require('express')
var router = express.Router()
let Api = require('./lolapi/api')
let Request = require('./lolapi/request')
let limiting = require('./lolapi/limiting')
let wsm = require('../ws/wsm')
let moment = require('moment-timezone')
const auth = require('../auth')
const log = require('../logging')
const store = require('../store')
const db = require('../db')()

let liveMatches = require('./liveMatches')
let app = require('./app')
let parsers = {summoners: require('../parsers/summoners'), matches: require('../parsers/matches'), fillSummonersActivity: require('../parsers/fillSummonersActivity')}

router

.use('/users', require('./users'))

.get('/limits/', async (req, res) => {
  //Api.limiting('ru', 'summoner/by-name')
  //parsers.summoners()
  //await db.collection('notes').drop()
  //await db.collection('notes').insertOne({q: 1})
  //db.command({planCacheClear: 'notes'})
  //console.log((await db.collection(`summoners-ru`).findOne({summonerId: 'ewmbx-qnKnLvwxmN8Nf3FhyEL_ZrP7pSZlmHGA5ghFvP'})).leagues)
  //console.log(await db.collection(`summoners-ru`).find({tier: 'SILVER', division: 'I'}).toArray())
  //console.log(await db.collection(`leagues-ru`).findOne({summonerId: "GCViYHyTZsx7WDN7-r8T4dPGWTz8Z5hlGX94xe-ix7eI"}, {projection: {_id: 0}}))
  //console.log(Math.floor(moment.tz("America/Los_Angeles").format('X') / 86400), moment(Math.floor(moment.tz("Australia/Sydney").format('X') / 86400) * 86400000).format())
  //console.log(await Api.matchesByAccount('ru', ['2jbZ6z-6LJa0TvEz0zmrxK5_wybfTeyIjCuUd2GQlSZjEhaA4DOFsQwv', ['3iI6-jZFD_RzN_KTTO-7SWvdGI51NtXF8kAZ8pekTr_w-Fw', {saved: {accountId: '3iI6-jZFD_RzN_KTTO-7SWvdGI51NtXF8kAZ8pekTr_w-Fw'}}]]))
  //console.log(await Api.fullMatch('ru', [267579684, 267587221]))
  //console.log(process.hrtime())
  //console.log(await Api.summonerByName('ru', 'Agóny'))
  //console.log((await db.collection(`summoners-ru`).find({accountId: {$exists: true}}).toArray()).slice(0, 20))
  res.json(limiting.getAll())
})

.get('/parse/summoners', async (req, res) => {
  res.json({})
  parsers.summoners()
})

.get('/parse/matches', async (req, res) => {
  res.json({})
  parsers.matches('ru')
})

.get('/parse/fillSummonersActivity', async (req, res) => {
  res.json({})
  parsers.fillSummonersActivity('ru')
})

.get('/key', auth.required, (err, req, res, next) => {
  console.log(err)
  if (err.message === 'No authorization token was found')
    return res.json({
      status: 401,
      message: 'auth-01'
    })
  if (err.message === 'invalid signature') {
    return res.json({
      status: 401,
      error: 'auth-02'
    })
  }
  if (err.code === 'invalid_token') {
    return res.json({
      status: 401,
      error: 'auth-03'
    })
  }
}, async (req, res) => {
  //await Api.statusTest()
  res.json({key: store.getState().riotapikey, expired: Request.apiKeyExpired})
})

.post('/key', auth.required, (err, req, res, next) => {
  console.log(err)
  if (err.message === 'No authorization token was found')
    return res.json({
      status: 401,
      message: 'auth-01'
    })
  if (err.message === 'invalid signature') {
    return res.json({
      status: 401,
      error: 'auth-02'
    })
  }
  if (err.code === 'invalid_token') {
    return res.json({
      status: 401,
      error: 'auth-03'
    })
  }
}, async (req, res) => {
  if (req.body.key) {
    await db.collection('config').updateOne({key: 'riotapi_key'}, {$set: {value: req.body.key}})
    store.dispatch({type: 'UPDATE_RIOTAPIKEY', data: (await db.collection('config').findOne({key: 'riotapi_key'})).value})
    Request.apiKeyExpired = false
  }
})

.get('/liveMatches/', async (req, res) => {
  res.json({status: 200, d: Object.values(app.getLiveMatches())
    .filter(plfLM => Object.values(plfLM).length && Object.values(plfLM).find(m => m.status === 200 && m.loadstatus.match))
    .map(plfLM => Object.values(plfLM)
      .filter(m => m.status === 200 && m.loadstatus.match)
      .map(m => {return {
        plf: m.plf,
        participants: m.d.matchInfo.participants.map(p => {return {
          summonerName: p.summonerName,
          championId: p.championId,
          teamId: p.teamId
        }})
      }})
    ).flat()
  })
})

.get('/summoner/:rg/:summonerName', async (req, res) => {
  //return res.json({"status":200,"data":{"_id":"5e7663f8b6e0632520c69b13","summonerId":"Png-LclA14EcvjHPJrLI17xGgMvaUX3PDuvX5VSThVHTzw","summonerName":"DruzhokK","rank":"II","tier":"DIAMOND","wins":97,"losses":105,"leaguePoints":0,"leagues":{"2020-2-15":{"tier":"DIAMOND","rank":"II","wins":96,"losses":104,"leaguePoints":0},"2020-2-16":{"tier":"DIAMOND","rank":"II","wins":96,"losses":104,"leaguePoints":0},"2020-2-17":{"tier":"DIAMOND","rank":"II","wins":96,"losses":104,"leaguePoints":0},"2020-2-21":{"tier":"DIAMOND","rank":"II","wins":97,"losses":105,"leaguePoints":0}},"accountId":"3iI6-jZFD_RzN_KTTO-7SWvdGI51NtXF8kAZ8pekTr_w-Fw","profileIconId":1384,"summonerLevel":191}})
  res.json(await app.summoner(req.params.rg, req.params.summonerName))
})

.get('/summonerProfile/:rg/:summonerName', async (req, res) => {
  //return res.json({"status":200,"data":{"_id":"5e7663f8b6e0632520c69b13","summonerId":"Png-LclA14EcvjHPJrLI17xGgMvaUX3PDuvX5VSThVHTzw","summonerName":"DruzhokK","rank":"II","tier":"DIAMOND","wins":97,"losses":105,"leaguePoints":0,"leagues":{"2020-2-15":{"tier":"DIAMOND","rank":"II","wins":96,"losses":104,"leaguePoints":0},"2020-2-16":{"tier":"DIAMOND","rank":"II","wins":96,"losses":104,"leaguePoints":0},"2020-2-17":{"tier":"DIAMOND","rank":"II","wins":96,"losses":104,"leaguePoints":0},"2020-2-21":{"tier":"DIAMOND","rank":"II","wins":97,"losses":105,"leaguePoints":0}},"accountId":"3iI6-jZFD_RzN_KTTO-7SWvdGI51NtXF8kAZ8pekTr_w-Fw","profileIconId":1384,"summonerLevel":191}})
  res.json(await app.summonerProfile(req.params.rg, req.params.summonerName))
})

.get('/stats/championsFull', async (req, res) => {
  res.json(Object.fromEntries(Object.values(await db.collection('champion-stats').find({}).toArray()).map(((champ) => [champ.id, champ.latest]))))
})

.get('/matchInfo/:rg/:summonerName/', async (req, res) => {
  res.json(await app.live(req.params.rg, req.params.summonerName))
})

.use('*', (req, res) => {
  res.json({status: 404, error: 'api404'})
})

module.exports = router