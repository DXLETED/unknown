var express = require('express')
var router = express.Router()
Api = require('./lolapi')

router

.get('/limits/', (req, res) => {
  //Api.limiting('ru', 'summoner/by-name')
  res.json(Api.limits())
})

.get('/key', async (req, res) => {
  await Api.statusTest()
  res.json({key: Api.api_key, expired: Api.apiKeyExpired})
})

.get('/summoner/:rg/:summonerName', async (req, res) => {
  let st = new Date
  try {
    var plf = Api.platform(req.params.rg)
  } catch(e) {
    console.log(e)
    return res.status(e).json({response_code: e})
  }
  try {
    var summoner = await Api.summonerByName(plf, req.params.summonerName)
  } catch(e) {
    console.log(e)
    return res.status(e).json({response_code: e})
  }
  res.json({response_code: 200, load_time: Date.now() - st, data: {summoner}})
})

.get('/matchInfo/:rg/:summonerName/', async (req, res) => {
  let st = new Date()
  try {
    var plf = Api.platform(req.params.rg)
  } catch(e) {
    console.log(e)
    return res.status(e).json({response_code: e})
  }
  try {
    var summoner = await Api.summonerByName(plf, req.params.summonerName)
  } catch(e) {
    console.log(e)
    return res.status(e).json({response_code: e})
  }
  try {
    var matchInfo = await Api.activeGame(plf, summoner.id)
  } catch(e) {
    console.log(e)
    return res.status(e).json({response_code: e})
  }
  participants = []
  for (summ of matchInfo.participants) {
    participants.push(summ.summonerName)
  }
  try {
    var summoners = await Api.MsummonerByName(plf, participants)
  } catch (e) {
    return res.status(e).json({response_code: e})
  }
  res.json({response_code: 200, load_time: Date.now() - st, matchInfo: matchInfo, summoners: summoners})
})

.use('*', (req, res) => {
  res.send('Api - 404')
})

module.exports = router