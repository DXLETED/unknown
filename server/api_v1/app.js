const Api = require('./lolapi/api')
const db = require('../db')()
const REGIONS = require('../constants/regions')
const sleep = require('../utils/sleep')
let fs = require('fs')

let liveMatches = {}, summonersList = {}, matchAwait = {}
for (plf of Object.values(REGIONS)) {
  liveMatches[plf] = {}
  summonersList[plf] = {}
  matchAwait[plf] = {}
}

const updateLiveMatch = (plf, gameId, data, loaded=null) => {
  if (loaded && gameId in liveMatches[plf])
    liveMatches[plf][gameId] = {...liveMatches[plf][gameId], loadstatus: {...liveMatches[plf][gameId].loadstatus, [loaded]: true}, d: {...liveMatches[plf][gameId].d, ...data}}
  else
    liveMatches[plf][gameId] = data
  wsm.send(`live-${plf}-${gameId}`, JSON.stringify(liveMatches[plf][gameId]))
}

const updateSummoner = (plf, summonerId, data, loaded=null) => {
  if (loaded && summonerId in summonersList[plf])
    summonersList[plf][summonerId] = {...summonersList[plf][summonerId], loadstatus: {...summonersList[plf][summonerId].loadstatus, [loaded]: true}, d: {...summonersList[plf][summonerId].d, ...data}}
  else if (!loaded)
    summonersList[plf][summonerId] = data
  wsm.send(`summoner-${plf}-${summonerId}`, JSON.stringify(summonersList[plf][summonerId]))
}

const deleteSummoner = (plf, summonerName) => {
  delete summonersList[plf][summonerName]
}

const deleteLiveMatch = (plf, gameId) => {
  delete liveMatches[plf][gameId]
  //wsm.send(`live-${plf}-${gameId}`, {})
}

const getPosition = (pl, team) =>
  Object.keys(pl.positions).sort((a, b) => pl.positions[a] < pl.positions[b] ? 1 : -1)
    .find(pos =>
      !Object.values(team).find(el => el.position == pos) &&
      pl.positions[pos] >= Math.max.apply(null, team.map(summ =>
        summ.positions[pos] == Math.max.apply(null, Object.values(summ.positions)) ? summ.positions[pos] : 0
      ))
    ) || Object.keys(pl.positions).sort((a, b) => pl.positions[a] < pl.positions[b] ? 1 : -1).find(pos => !(team.find(p => pos === p.position)))

const liveMatch = async (plf, summoner, matchInfo) => {
  let gameId = matchInfo.gameId
  if (gameId in liveMatches[plf] && !liveMatches[plf][gameId].loadstatus.ended)
    return {...liveMatches[plf][gameId]}
  let r = {teams: {team1: [], team2: []}, matchInfo}
  matchInfo.participants.map((el, i) => {
    r.teams['team' + el.teamId / 100][el.teamId == 100 ? i : i - 5] = el
  })
  for ([i, el] of [...r.teams.team1, ...r.teams.team2].entries()) {
    r.teams['team' + el.teamId / 100][el.teamId == 100 ? i : i - 5] = {
      ...el,
      id: el.teamId == 100 ? i : i - 5,
      positions: await (async () => {
        let summonerStats = await db.collection('champion-stats').findOne({id: el.championId.toString()})
        return summonerStats ? summonerStats.latest.positions : {top: 0, jng: 0, mid: 0, bot: 0, sup: 0}
      })()
    }
  }
  ;[...r.teams.team1, ...r.teams.team2].map((el, i) => {
    r.teams['team' + el.teamId / 100][el.teamId == 100 ? i : i - 5] = {
      ...el,
      id: el.teamId == 100 ? i : i - 5,
      position: getPosition(el, r.teams['team' + el.teamId / 100])
    }
  })
  if (!liveMatches[gameId] || !liveMatches[gameId].loadstatus.match)
    updateLiveMatch(plf, gameId, {d: r, plf, status: 200, loadstatus: {match: true, leagues: false, stats: false, ended: false}})
  
  new Promise(async () => {
    let participants = []
    for (summ of matchInfo.participants) {
      participants.push(summ.summonerId)
    }
    let leagues = (await Api.entriesBySummoner(plf, matchInfo.participants.map(summ => summ.summonerId))).filter(el => el.status === 200).map(el => el.data)
    ;[...r.teams.team1, ...r.teams.team2].map((el, i) => {
      r.teams['team' + el.teamId / 100][el.teamId == 100 ? i : i - 5] = {
        ...el,
        leagues: leagues.find(elSummonerLeague => elSummonerLeague && elSummonerLeague.find(elLeague => el.summonerId == elLeague.summonerId)) &&
          leagues.find(elSummonerLeague => elSummonerLeague.find(elLeague => el.summonerId == elLeague.summonerId)).map(el => ({
            queueType: el.queueType,
            tier: el.tier,
            leaguePoints: el.leaguePoints,
            rank: el.rank,
            wins: el.wins,
            losses: el.losses,
            hotStreak: el.hotStreak
          }))
      }
    })
    updateLiveMatch(plf, gameId, r, 'leagues')

    let update = setInterval(async () => {
      let status = (await Api.activeGame(plf, summoner.summonerId)).status
      if (status === 404) {
        clearInterval(update)
        let results = await Api.matches(plf, matchInfo.gameId)
        if (results.status === 200)
          updateLiveMatch(plf, gameId, {results: results.data}, 'ended')
        setTimeout(() => deleteLiveMatch(plf, gameId), 300000)
      }
    }, 5000)
  })
  return liveMatches[plf][gameId]
}

module.exports.live = async (rg, summonerName) => {
  try {
    var plf = Api.platform(rg)
  } catch(e) {
    return {status: 400, error: 'rg404'}
  }
  let summoner = await Api.summonerByName(plf, summonerName)
  if (summoner.status !== 200)
    if (summoner.status === 404)
      return {error: 'sum404'}
    else
      return summoner
    summoner = summoner.data
  let matchInfo = await Api.activeGame(plf, summoner.summonerId)
  if(summonerName === 'DruzhokK') matchInfo = JSON.parse(await fs.promises.readFile(__dirname + '/../testdata/matchInfo.json', 'utf8'))
  else if (matchInfo.status !== 200)
    if (matchInfo.status === 404) {
      matchAwait[plf][summoner.summonerId] = true
      return {error: 'notlive', plf, summonerId: summoner.summonerId}
    }
    else
      return matchInfo
    matchInfo = matchInfo.data
  return liveMatch(plf, summoner, matchInfo)
}

module.exports.summoner = async (rg, summonerName) => {
  try {
    var plf = Api.platform(rg)
  } catch(e) {
    return {status: 400, error: 'rg404'}
  }
  let summoner = await Api.accountByName(plf, summonerName)
  if (summoner.status !== 200) return {status: summoner.status}
    summoner = summoner.data
  return {status: 200, d: {summoner}}
}

module.exports.summonerProfile = async (rg, summonerName) => {
  try {
    var plf = Api.platform(rg)
  } catch(e) {
    return {status: 400, error: 'rg404'}
  }
  let summoner = await Api.accountByName(plf, summonerName)
  if (summoner.status !== 200) return {status: summoner.status}
    summoner = summoner.data
  let summonerId = summoner.summonerId
  updateSummoner(plf, summonerId, {status: 200, plf, loadstatus: {summoner: true, leagues: false, matchlist: false, matches: false, nowplaying: false}, d: {summoner}})
  new Promise(async () => {
    let leagues = await Api.entriesBySummoner(plf, summoner.summonerId)
    if (leagues.status !== 200) return {status: leagues.status}
      leagues = leagues.data
    updateSummoner(plf, summonerId, {leagues}, 'leagues')
  })
  new Promise(async () => {
    let activeGame = await Api.activeGame(plf, summonerId)
    if (activeGame.status !== 200)
      activeGame.status === 404 && summonersList[plf][summonerId] && updateSummoner(plf, summonerId, {nowplaying: false}, 'nowplaying')
    else
    summonersList[plf][summonerId] && updateSummoner(plf, summonerId, {nowplaying: true}, 'nowplaying')
  })
  new Promise(async () => {
    let matchlist = await Api.matchesByAccount(plf, summoner.accountId)
    if (matchlist.status !== 200) return {status: matchlist.status}
      matchlist = matchlist.data.matches
    let roles = matchlist.map((el, i) => {
      if (i < 20) {
        if (el.lane == 'TOP') return 'top'
        if (el.lane == 'JUNGLE') return 'jng'
        if (el.lane == 'MID') return 'mid'
        if (el.role == 'DUO_CARRY') return 'bot'
        if (el.role == 'DUO_SUPPORT') return 'sup'
      }
    })
    let positions = {top: 0, jng: 0, mid: 0, bot: 0, sup: 0}
    roles.map(el => el && positions[el] ++)
    updateSummoner(plf, summonerId, {matchlist, mainPosition: Object.keys(positions).find(el => positions[el] == Math.max.apply(null, Object.values(positions)))}, 'matchlist')
    new Promise(async () => {
      //let matches = (await Api.fullMatch(plf, matchlist.map(m => m.gameId))).filter(el => el.status === 200).map(el => el.data)
      let matches = (await Api.matches(plf, matchlist.map(m => m.gameId))).filter(el => el.status === 200).map(el => {return {match: el.data}})
      for (let [i, m] of matches.entries()) {
        for (let [ii, pl] of m.match.participants.entries()) {
          matches[i].match.participants[ii] = {
            ...pl,
            positions: await (async () => {
              let summonerStats = await db.collection('champion-stats').findOne({id: pl.championId.toString()})
              return summonerStats ? summonerStats.latest.positions : {top: 0, jng: 0, mid: 0, bot: 0, sup: 0}
            })()
          }
        }
        for (let [ii, pl] of m.match.participants.entries()) {
          matches[i].match.participants[ii] = {
            ...pl,
            position: getPosition(pl, m.match.participants.filter(p => p.teamId === pl.teamId))
          }
        }
      }
      if (matches.length) matches = matches.sort((x, y) => x.gameCreaction - y.gameCreaction)
      updateSummoner(plf, summonerId, {matches}, 'matches')
    })
  })
  return summonersList[plf][summonerId]
}

module.exports.clearSummonerProfile = (plf, summonerId) => {
  delete summonersList[plf][summonerId]
}

module.exports.clearMatchAwait = (plf, summonerId) => {
  delete matchAwait[plf][summonerId]
}

(async () => {
  while(true) {
    Object.keys(summonersList).map(plf =>
      Object.keys(summonersList[plf]).map(summonerId => {
        new Promise(async () => {
          let activeGame = await Api.activeGame(plf, summonerId)
          if (activeGame.status !== 200)
            activeGame.status === 404 && summonerId in summonersList[plf] && summonersList[plf][summonerId].d.nowplaying && updateSummoner(plf, summonerId, {nowplaying: false}, 'nowplaying')
          else
            summonerId in summonersList[plf] && !summonersList[plf][summonerId].d.nowplaying && updateSummoner(plf, summonerId, {nowplaying: true}, 'nowplaying')
        })
      })
    )
    await Promise.all(
      Object.keys(matchAwait).map(plf => 
        Object.keys(matchAwait[plf]).map(summonerId => {
          return new Promise(async res => {
            let activeGame = await Api.activeGame(plf, summonerId)
            if (activeGame.status === 200) {
              wsm.move(`matchAwait-${plf}-${summonerId}`, `live-${plf}-${activeGame.data.gameId}`, wsm.get(`matchAwait-${plf}-${summonerId}`))
              liveMatch(plf, {summonerId}, activeGame.data)
              delete matchAwait[plf][summonerId]
            }
            res()
          })
        })
      ).flat()
    )
    await sleep(5000)
  }
})()

module.exports.getLiveMatches = () => liveMatches