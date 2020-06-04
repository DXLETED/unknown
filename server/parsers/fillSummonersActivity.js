const log = require('../logging')
const Api = require('../api_v1/lolapi/api')
const db = require('../db')()
const dbClient = require('../db').client()

module.exports = (async (plf) => {
  log.info('PARSE: SUMMONERS - STARTED')
  let summonersIn
  if (!(await db.collection(`summonersActivity-${plf}`).find({latestMatch: {$gte: Date.now() - 36000000}}).count()))
    summonersIn = (await db.collection(`summoners-ru`).find({accountId: {$exists: true}}).toArray()).slice(0, 20)
  else
    summonersIn = (await db.collection(`summonersActivity-${plf}`).find({latestMatch: {$gte: Date.now() - 36000000}}).toArray()).slice(0, 1000)
  //let summonersIn = [(await db.collection(`summonersActivity-${plf}`).find({}).toArray())[0]]
  //console.log(summoners.filter(Boolean).map(el => [el.accountId, {saved: {accountId: el.accountId}}]))
  let summonersActivity = {}
  let matchesUnsorted = []
  let ids
  for (let i = 0; i < summonersIn.length; i += 20) {
    ids = summonersIn.slice(i, i + 20).filter(el => el && el).map(el => [el.accountId, {saved: {summonerId: el.summonerId, accountId: el.accountId}}])
    ;(await Api.matchesByAccount(plf, ids)).filter(res => res.status === 200).map(el => {
      if (el.data.matches.length) {
        summonersActivity[el.saved.summonerId] = {accountId: el.saved.accountId, latestMatch: el.data.matches[0].timestamp}
        matchesUnsorted = [...matchesUnsorted, ...el.data.matches]
      }
    })
  }
  matchesUnsorted = matchesUnsorted.filter(el => el && el.platformId.toLowerCase() === plf).filter((v, i, a) => a.indexOf(v) === i)
  for (let i = 0; i < matchesUnsorted.length; i += 20) {
    let ids = matchesUnsorted.slice(i, i + 20).filter(Boolean).map(el => el.gameId)
    //console.log((await Api.matches(plf, matchIds)).map(el => el.status))
    //console.log(await Api.matches(plf, matchIds))
    let matches = (await Api.matches(plf, ids)).filter(res => res.status === 200).map(res => res.data)
    for (let [i, m] of matches.entries()) {
      m.participantIdentities.map(p => {
        if (!(summonersActivity[p.player.summonerId] && summonersActivity[p.player.summonerId].latestMatch <= m.gameCreation))
          summonersActivity[p.player.summonerId] = {accountId: p.player.currentAccountId, summonerName: p.player.summonerName, latestMatch: m.gameCreation}
      })
    }
  }
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
  log.info('PARSE: SUMMONERS - DONE')
})