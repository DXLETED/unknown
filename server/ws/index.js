var express = require('express')
var router = express.Router()
const wsm = require('./wsm')
let liveMatches = require('../api_v1/liveMatches')
let app = require('../api_v1/app')
let fs = require('fs')

router

.ws('/limits', function(ws, req) {
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

.ws('/live/:rg/:summonerName', async (ws, req) => {
  //var r = JSON.parse(await fs.promises.readFile(__dirname + '/../testdata/live.json', 'utf8'))
  let r = await app.live(req.params.rg, req.params.summonerName)
  ws.send(JSON.stringify(r))
  if (r.status == 200) {
    wsm.addToGroup(`live-${r.plf}-${r.d.matchInfo.gameId}`, ws)
    ws.on('close', () => {
      wsm.removeFromGroup(`live-${r.plf}-${r.d.matchInfo.gameId}`, ws)
    })
  } else {
    if (r.error === 'notlive') {
      wsm.addToGroup(`matchAwait-${r.plf}-${r.summonerId}`, ws)
      ws.on('close', () => {
        wsm.removeFromGroup(`matchAwait-${r.plf}-${r.summonerId}`, ws)
        app.clearMatchAwait(r.plf, r.summonerId)
        wsm.findAndRemove(ws)
      })
    }
  }
})

.ws('/summonerProfile/:rg/:summonerName', async (ws, req) => {
  let r = await app.summonerProfile(req.params.rg, req.params.summonerName)
  if (r.status === 200) {
    wsm.addToGroup(`summoner-${r.plf}-${r.d.summoner.summonerId}`, ws)
    ws.send(JSON.stringify(r))
    ws.on('close', () => {
      wsm.removeFromGroup(`summoner-${r.plf}-${r.d.summoner.summonerId}`, ws)
      app.clearSummonerProfile(r.plf, r.d.summoner.summonerId)
    })
  } else {
    ws.send(JSON.stringify(r))
  }
})

module.exports = router