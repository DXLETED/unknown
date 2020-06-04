const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads')
let Api = require('../api_v1/lolapi')
let moment = require('moment-timezone')
const REGIONS = require('../constants/regions')
const TIERS = require('../constants/tiers')
const DIVISIONS = require('../constants/divisions')
const TIMEZONES = require('../constants/timezones')
let db, clientDB

const getEntriesIteration = async (plf, queue, tier, division, page, entries) => {
  try {
    var r = await Api.entries(plf, {queue, tier, division, page: page})
  } catch(e) {
    console.log(e)
    return
  }
  entries(r)
  if (r.length != 0) {
    await getEntriesIteration(plf, queue, tier, division, page + 1, entries)
  } else {
    r = null
    return
  }
}

const getEntries = async (plf, queue, tier, division) => {
  let entries = []
  await getEntriesIteration(plf, queue, tier, division, 1, r => entries = [...entries, ...r])
  return entries
}

getLeagues = (leagues, summonerId) => {
  let r = leagues.find(leaguesEl => leaguesEl.summonerId == summonerId)
  if (r) {
    if ('leagues' in r)
      return r.leagues
    else
      return undefined
  } else {
    return undefined
  }
}

getDivisionEntries = async (plf, tier, division) => {
  let entries = await getEntries(plf, 'RANKED_SOLO_5x5', tier, division)
  //let entries = await db.collection(`summoners-${plf}`).find({tier: tier, rank: division}).toArray()
  let d = new Date()
  //let leaguesRaw = await db.collection(`summoners-${plf}`).find({summonerId: {$in: entries.map(el => el.summonerId)}}).toArray()
  let rSummoners = []
  let rLeagues = []
  let summonersRaw = await db.collection(`summoners-${plf}`).find({summonerId: {$in: entries.map(el => el.summonerId)}}).toArray()
  let summoners = {}
  for (s of summonersRaw) {
    summoners[s.summonerId] = s
  }
  if (entries.length) {
    rSummoners = entries.map(el => {return {
        ...s[el.summonerId],
        summonerId: el.summonerId,
        summonerName: el.summonerName,
        /*
        rank: el.rank,
        tier: el.tier,
        wins: el.wins,
        losses: el.losses,
        leaguePoints: el.leaguePoints,
        leagues: {...leagues[el.summonerId], [`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`]: {tier: el.tier, rank: el.rank, wins: el.wins, losses: el.losses, leaguePoints: el.leaguePoints}}
        */
      }
    })
    rLeagues = entries.map(el => {return {
      summonerId: el.summonerId,
      date: Math.floor(moment.tz(TIMEZONES[plf]).format('X') / 86400),
      rank: el.rank,
      tier: el.tier,
      wins: el.wins,
      losses: el.losses,
      leaguePoints: el.leaguePoints
    }})
    //console.log(await clientDB.db('test').collection(`summoners-${plf}`).find({summonerId: {$in: entries.map(el => el.summonerId)}}).toArray())
    let session = clientDB.startSession()
    console.log(Date.now(), 1)
    try {
      await session.withTransaction(async () => {
        await clientDB.db('test').collection(`summoners-${plf}`).deleteMany({summonerId: {$in: rSummoners.map(el => el.summonerId)}}, {session})
        await clientDB.db('test').collection(`summoners-${plf}`).insertMany(rSummoners, {session})
        await clientDB.db('test').collection(`leagues-${plf}`).insertMany(rLeagues, {session})
      })
    } catch (e) {
      console.log(e)
    } finally {
      await session.endSession()
    }
    console.log(Date.now(), 2)
    entries = null
    leagues = null
    global.gc()
  }
}

getPlatformEntries = async plf => {
  let async = true
  if (!db.collection(`summoners-${plf}`).find({}).toArray().length)
    await db.createCollection(`summoners-${plf}`)
  if (!db.collection(`leagues-${plf}`).find({}).toArray().length)
    await db.createCollection(`leagues-${plf}`)
  await db.collection(`leagues-${plf}`).deleteMany({date: {$lt: Math.floor(moment.tz(TIMEZONES[plf]).format('X') / 86400) - 30}})
  await db.collection(`leagues-${plf}`).deleteMany({date: Math.floor(moment.tz(TIMEZONES[plf]).format('X') / 86400)})
  await new Promise(async res1 => {
    for (let tier of TIERS) {
      if (async) {
        await Promise.all(DIVISIONS[tier].map(async division => {
          console.log(plf, tier, division, 'STARTED')
          await getDivisionEntries(plf, tier, division)
          console.log(plf, tier, division, 'FINISHED')
        }))
      } else {
        await new Promise(async res2 => {
          for(let division of DIVISIONS[tier]) {
            console.log(plf, tier, division, 'STARTED')
            await getDivisionEntries(plf, tier, division)
            console.log(plf, tier, division, 'FINISHED')
          }
          res2()
        })
      }
    }
    res1()
  })
}

module.exports.summoners = async () => {
  console.log(process.memoryUsage())
  /*
  for (let plf of Object.values(REGIONS)) {
    await getPlatformEntries(plf)
  }
  console.log('PARSE: SUMMONERS - DONE', process.memoryUsage())
  */
 /*
  Promise.all(['br1'].map(async plf => await getPlatformEntries(plf)))
    .then(r => console.log('PARSE: SUMMONERS - DONE', process.memoryUsage()))
  */
}

if (isMainThread) {
  module.exports = () => {
    console.log("this is the main thread")
    let w = new Worker(__filename, {workerData: null})
    w.on('message', (msg) => {
      console.log(msg)
    })
    w.on('error', console.error)
    w.on('exit', (code) => {
      if(code != 0)
          console.error(new Error(`Worker stopped with exit code ${code}`))
    })
  }
} else {
  (async () => {
    clientDB = await require('../connect')
    db = clientDB.db('test')
    console.log("this isn't")
    //parentPort.postMessage({q: 1})
    await Promise.all(['ru'].map(async plf => await getPlatformEntries(plf)))
    console.log('PARSE: SUMMONERS - DONE', process.memoryUsage())
  })()
}