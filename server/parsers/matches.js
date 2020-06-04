const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads')
const REGIONS = require('../constants/regions')
const TIERS = require('../constants/tiers')
const DIVISIONS = require('../constants/divisions')
const MongoClient = require('mongodb').MongoClient
const log = require('../logging')
const limiting = require('../api_v1/lolapi/limiting')
const store = require('../store')
const util = require('util')
let Api
let db
let dbClient
let startitems
let coreitems
let boots

require('events').EventEmitter.defaultMaxListeners = 100

const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
const uniqUsage = (arr) => {
  let counts = {}
  arr.forEach(el => counts[el] = 1 + (counts[el] || 0))
  return counts
}

const platformMatches = async plf => {
  //let summonersIn = (await db.collection(`summoners-${plf}`).find({accountId: {$exists: true}}).toArray())
  //let summonersIn = [{accountId: 'SbPhrraY0wnwEq8HKDgDjHXHI2oWnW5vPoZdBFcPI4qR5Gs'}, {accountId: 'LNGcOLS-C8Taaya0qckgmdHM65IY91muHin6DVy21xaxj2U'}]
  //let summonersIn = [{accountId: 'SbPhrraY0wnwEq8HKDgDjHXHI2oWnW5vPoZdBFcPI4qR5Gs'}]
  let summonersIn
  if (!(await db.collection(`summonersActivity-${plf}`).find({latestMatch: {$gte: Date.now() - 3600000000}}).count()))
    summonersIn = (await db.collection(`summoners-${plf}`).find({accountId: {$exists: true}}).toArray()).slice(0, 20)
  else
    summonersIn = (await db.collection(`summonersActivity-${plf}`).find({latestMatch: {$gte: Date.now() - 3600000000}}).toArray()).slice(0, 20)
  let matchesUnsorted = []
  parentPort.postMessage({type: 'START_PROGRESS', value: summonersIn.length, text: 'Loading account matches'})
  for (let i = 0; i < summonersIn.length; i += 20) {
    let ids = summonersIn.slice(i, i + 20).filter(el => el && el).map(el => el.accountId)
    ;(await Api.matchesByAccount(plf, ids)).filter(res => res.status === 200).map(el => matchesUnsorted = [...matchesUnsorted, ...el.data.matches])
    parentPort.postMessage({type: 'UPDATE_PROGRESS', value: i + ids.length})
  }
  parentPort.postMessage({type: 'STOP_PROGRESS'})
  matchesUnsorted = matchesUnsorted.filter(el => el && el.platformId.toLowerCase() === plf).filter((v, i, a) => a.indexOf(v) === i)

  let summonersActivity = {}
  let preStats = {
    gameDuration: [],
    champions: {}
  }
  parentPort.postMessage({type: 'START_PROGRESS', value: matchesUnsorted.length, text: 'Loading matches'})
  for (let i = 0; i < matchesUnsorted.length; i += 20) {
    let ids = matchesUnsorted.slice(i, i + 20).filter(el => el && el).map(el => el.gameId)
    let matches = (await Api.fullMatch(plf, ids)).filter(res => res.status === 200).map(res => res.data)
    for (let [i, m] of matches.entries()) {
      if (m.match.gameDuration >= 600 && m.match.gameMode === 'CLASSIC') {
        preStats.gameDuration.push(m.match.gameDuration)
        let events = m.timelines.frames.flatMap(frame => frame.events)
        //let wTeam = m.teams.filter(el => el.win === 'Win')[0].teamId
        //console.log(wTeam)
        m.match.participants.map(pl => {
          if (!preStats.champions[pl.championId]) preStats.champions[pl.championId] = []
          //let events = m.timelines.frames.flatMap(frame => frame.events.filter(event => event.participantId === 1))
          preStats.champions[pl.championId].push({
            gameMode: m.match.gameMode,
            win: pl.stats.win,
            kills: pl.stats.kills,
            deaths: pl.stats.deaths,
            assists: pl.stats.assists,
            runes: [pl.stats.perk0, pl.stats.perk1, pl.stats.perk2, pl.stats.perk3, pl.stats.perk4, pl.stats.perk5],
            items: [pl.stats.item0, pl.stats.item1, pl.stats.item2, pl.stats.item3, pl.stats.item4, pl.stats.item5],
            position: (() => {
              if (pl.timeline.lane === 'TOP') {
                return 'top'
              } else if (pl.timeline.lane === 'JUNGLE') {
                return 'jng'
              } else if (pl.timeline.lane === 'MIDDLE') {
                return 'mid'
              } else if (pl.timeline.role === 'DUO_CARRY') {
                return 'bot'
              } else if (pl.timeline.role === 'DUO_SUPPORT') {
                return 'sup'
              } else {
                return null
              }
            })(),
            cs: avg(Object.values(pl.timeline.creepsPerMinDeltas)),
            skillOrder: events.filter(event => event.participantId === pl.participantId).filter(event => event.type === 'SKILL_LEVEL_UP').map(el => el.skillSlot),
            killsTimeline: events.filter(event => event.killerId === pl.participantId).filter(el => el.type === 'CHAMPION_KILL').map(el => el.timestamp),
            assistsTimeline: events.filter(el => el.type === 'CHAMPION_KILL').filter(el => el.assistingParticipantIds.find(pId => pId === pl.participantId)).map(el => el.timestamp),
            deathsTimeline: events.filter(event => event.victimId === pl.participantId).filter(el => el.type === 'CHAMPION_KILL').map(el => el.timestamp),
            itemBuild: events.filter(event => event.participantId === pl.participantId).filter(event => event.type === 'ITEM_PURCHASED').map(el => el.itemId)
          })
        })
      }
      m.match.participantIdentities.map(p => {
        if (!(summonersActivity[p.player.summonerId] && summonersActivity[p.player.summonerId].latestMatch <= m.gameCreation))
          summonersActivity[p.player.summonerId] = {accountId: p.player.currentAccountId, summonerName: p.player.summonerName, latestMatch: m.gameCreation}
      })
      parentPort.postMessage({type: 'UPDATE_PROGRESS', value: i + 1})
    }
    parentPort.postMessage({type: 'UPDATE_PROGRESS', value: i + ids.length})
  }
  parentPort.postMessage({type: 'STOP_PROGRESS'})
  let stats = {champions: {}}
  //console.log(preStats)
  stats.gameDuration = avg(preStats.gameDuration)
  for (let [champId, champ] of Object.entries(preStats.champions)) {
    stats.champions[champId] = {
      pickCount: champ.length,
      winrate: champ.filter(el => el.win).length / champ.length,
      kills: champ.map(el => el.kills).reduce((a, b) => a + b) / champ.length,
      deaths: champ.map(el => el.deaths).reduce((a, b) => a + b) / champ.length,
      assists: champ.map(el => el.assists).reduce((a, b) => a + b) / champ.length,
      positions: (() => {
        let positions = {top: 0, jng: 0, mid: 0, bot: 0, sup: 0}
        champ.map(el => el.position && positions[el.position] ++)
        return Object.fromEntries(Object.entries(positions).map(([position, positionCount]) => [position, positionCount / Object.values(positions).reduce((x, y) => x + y)]))
      })(),
      skillOrders: (() => {
        let builds = {}
        champ.map(el => [el.win, el.skillOrder]).map(([win, build]) => {
          if (build.length >= 15) {
            let buildKey = JSON.stringify(build.slice(0, 15))
            if (!(buildKey in builds)) builds[buildKey] = {count: 0, wins: 0}
            builds[buildKey].count ++
            if (win) builds[buildKey].wins ++
          }
        })
        return Object.fromEntries(Object.entries(builds)
          .map(([build, buildStats]) => [build, {
            pickrate: buildStats.count / Object.values(builds).map(buildStats => buildStats.count).reduce((x, y) => x + y),
            winrate: buildStats.wins / Object.values(builds).map(buildStats => buildStats.wins).reduce((x, y) => x + y)
          }])
          .sort((x, y) => y[1].pickrate - x[1].pickrate)
          .filter(([build, buildStats], i) => i < 10)
        )
      })(),
      runes: {
        all: (() => {
          let allRunes = {}
          champ.map(el => [el.win, el.runes]).map(([win, build]) => build.map(perk => {
            if (!(perk in allRunes)) allRunes[perk] = {count: 0, wins: 0}
            allRunes[perk].count ++
            if (win) allRunes[perk].wins ++
          }))
          return Object.fromEntries(Object.entries(allRunes).map(([perk, perkStats]) => [perk, {
            pickrate: perkStats.count / Object.values(allRunes).map(buildStats => buildStats.count).reduce((x, y) => x + y) * 6,
            winrate: perkStats.wins / Object.values(allRunes).map(buildStats => buildStats.wins).reduce((x, y) => x + y) * 6
          }]))
        })(),
        builds: (() => {
          let builds = {}
          champ.map(el => [el.win, el.runes]).map(([win, build]) => {
            let buildKey = JSON.stringify(build)
            if (!(buildKey in builds)) builds[buildKey] = {count: 0, wins: 0}
            builds[buildKey].count ++
            if (win) builds[buildKey].wins ++
          })
          return Object.fromEntries(Object.entries(builds)
            .map(([build, buildStats]) => [build, {
              pickrate: buildStats.count / Object.values(builds).map(buildStats => buildStats.count).reduce((x, y) => x + y),
              winrate: buildStats.wins / Object.values(builds).map(buildStats => buildStats.wins).reduce((x, y) => x + y)
            }])
            .sort((x, y) => y[1].pickrate - x[1].pickrate)
            .filter(([build, buildStats], i) => i < 10)
          )
        })()
      },
      items: {
        final: Object.fromEntries(Object.entries(uniqUsage([].concat.apply([], champ.map(el => el.items.filter(item => item !== 0))))).map(([item, itemCount]) => [item, itemCount / champ.length])),
        builds: (() => {
          let builds = {}
          champ.map(el => [el.win, el.itemBuild.filter(item => coreitems.find(citem => citem === item))]).map(([win, build]) => {
            if (build.length >= 3) {
              let buildKey = JSON.stringify(build.slice(0, 15))
              if (!(buildKey in builds)) builds[buildKey] = {count: 0, wins: 0}
              builds[buildKey].count ++
              if (win) builds[buildKey].wins ++
            }
          })
          return Object.fromEntries(Object.entries(builds)
            .map(([build, buildStats]) => [build, {
              pickrate: buildStats.count / Object.values(builds).map(buildStats => buildStats.count).reduce((x, y) => x + y),
              winrate: buildStats.wins / Object.values(builds).map(buildStats => buildStats.wins).reduce((x, y) => x + y) || 0
            }])
            .sort((x, y) => y[1].pickrate - x[1].pickrate)
            .filter(([build, buildStats], i) => i < 10)
          )
        })(),
        core: (() => {
          let coreItemsCount = []
          champ.map(el => el.itemBuild.filter(item => coreitems.find(citem => citem === item)).map((item, i) => {
            if (!(i in coreItemsCount)) coreItemsCount[i] = {}
            if (!(item in coreItemsCount[i])) coreItemsCount[i][item] = 0
            coreItemsCount[i][item] ++
          }))
          return coreItemsCount.map(order => Object.fromEntries(Object.entries(order).map(([item, itemCount]) => [item, itemCount / Object.values(order).reduce((x, y) => x + y)])))
        })(),
        boots: (() => {
          let bootsItemsCount = []
          champ.map(el => {
            let item = el.itemBuild.find(item => boots.find(citem => citem === item))
            if (item) {
              if (!(item in bootsItemsCount)) bootsItemsCount[item] = 0
              bootsItemsCount[item] ++
            }
          })
          return Object.fromEntries(Object.entries(bootsItemsCount).map(([item, itemCount]) => [item, itemCount / Object.values(bootsItemsCount).reduce((x, y) => x + y)]))
        })()
      }
    }
  }

  // Saving champion stats
  for (let [champId, champ] of Object.entries(stats.champions)) {
    await db.collection('champion-stats').updateOne({id: champId}, {$set: {
      ...await db.collection('champion-stats').findOne({id: champId}),
      id: champId,
      [Math.floor(Date.now() / 86400000)]: champ,
      latest: champ
    }}, {upsert: true})
  }

  // Saving summoners ids
  let summonersCurrent = Object.fromEntries((await db.collection(`summoners-${plf}`).find({summonerId: {$in: Object.keys(summonersActivity)}}).toArray()).map(summ => [summ.summonerId, summ]))
  if (!db.collection(`summonersActivity-${plf}`).find({}).toArray().length)
    await db.createCollection(`summonersActivity-${plf}`)
  let session = dbClient.startSession()
  try {
    await session.withTransaction(async () => {
      await dbClient.db('test').collection(`summoners-${plf}`).deleteMany({summonerId: {$in: Object.keys(summonersActivity)}}, {session})
      await dbClient.db('test').collection(`summoners-${plf}`).insertMany(Object.entries(summonersActivity).map(([summonerId, summ]) => {return {...summonersCurrent[summonerId], ...{summonerId: summonerId, accountId: summ.accountId, summonerName: summ.summonerName}}}), {session})
      await dbClient.db('test').collection(`summonersActivity-${plf}`).deleteMany({accountId: {$in: Object.values(summonersActivity).map(el => el.accountId)}}, {session})
      await dbClient.db('test').collection(`summonersActivity-${plf}`).insertMany(Object.values(summonersActivity).map(el => {return {accountId: el.accountId, latestMatch: el.latestMatch}}), {session})
    })
  } catch (e) {
    console.log(e)
  } finally {
    await session.endSession()
  }
  console.log(util.inspect(stats, {showHidden: false, depth: null}))
}

if (isMainThread) {
  module.exports = plf => {
    let w = new Worker(__filename, {workerData: {name: 'matches', plf: plf}})
    const cliProgress = require('cli-progress')
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
    w.on('message', async (msg) => {
      if (msg.type == 'LIMITING') {
        await limiting.iteration(msg.plf, msg.method)
        w.postMessage({type: 'LIMITING', id: msg.id})
      }
      if (msg.type == 'START_PROGRESS') {
        console.log(msg.text)
        bar.start(msg.value, 0)
      }
      if (msg.type == 'UPDATE_PROGRESS') {
        bar.update(msg.value)
      }
      if (msg.type == 'STOP_PROGRESS') {
        bar.stop()
      }
    })
    w.on('error', console.error)
    w.on('exit', (code) => {
      bar.stop()
      if(code != 0)
        console.error(new Error(`Worker stopped with exit code ${code}`))
    })
  }
} else {
  (async () => {
    const client = await MongoClient.connect('mongodb://localhost:27017', {useUnifiedTopology: true})
    require('../db').set(client.db('test'), client)
    db = require('../db')()
    dbClient = require('../db').client()
    startitems = JSON.parse((await db.collection('config').findOne({key: 'startitems'})).value)
    coreitems = JSON.parse((await db.collection('config').findOne({key: 'coreitems'})).value)
    boots = JSON.parse((await db.collection('config').findOne({key: 'boots'})).value)
    store.dispatch({type: 'UPDATE_RIOTAPIKEY', data: (await db.collection('config').findOne({key: 'riotapi_key'})).value})
    Api = require('../api_v1/lolapi/api')
    //await Promise.all(Object.values(REGIONS).map(async plf => await getPlatformEntries(plf)))
    log.info('PARSE: MATCHES - STARTED')
    await platformMatches(workerData.plf)
    log.info('PARSE: MATCHES - DONE')
    // process.memoryUsage()
    setTimeout(process.exit, 5000)
  })()
}