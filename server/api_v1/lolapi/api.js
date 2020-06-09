const db = require('../../db')()

const request = require('./request')
const REGIONS = require('../../constants/regions')

class Api {
  limits() {
    return {'time': Date.now(), 'regions': limits}
  }
  platform(rg) {
    if (rg in REGIONS) {
      return REGIONS[rg]
    } else {
      throw {status: 400, error: 'api-wrrg'}
    }
  }
  region(plf) {
    return Object.keys(REGIONS).find(rg => plf === REGIONS[rg])
  }
  async statusTest() {
    try {
      await request.single('https://ru.api.riotgames.com/lol/status/v3/shard-data')
    } catch {
      return false
    }
    return true
  }
  async summonerByName(plf, data) {
    let r
    if (Array.isArray(data)) {
      let urls = []
      r = []
      for (let [i, d] of data.entries()) {
        /*
        if (!(/^[\w\. ]+$/.test(d))) {
          return {status: 400, error: 'api-wrname'}
        }*/
        let cache = await db.collection(`summoners-${plf}`).findOne({summonerName: new RegExp(['^', d, '$'].join(''), 'i')}, {projection: {_id: 0}})
        if (typeof cache !== 'undefined' && cache !== null) {
          r[i] = {status: 200, data: {summonerId: cache.summonerId, summonerName: cache.summonerName}}
          continue
        }
        urls.push({
          url: `https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURI(d)}`,
          plf,
          method: 'summoner/by-name'
        })
      }
      if (urls.length){
        let loaded = await request.multiple(urls)
        await db.collection(`summoners-${plf}`).insertMany(loaded.filter(el => el.status == 200).map(el => {return {...el, data: {
          accountId: el.data.accountId,
          ppuid: el.data.ppuid,
          name: el.data.name,
          profileIconId: el.data.profileIconId,
          summonerLevel: el.data.summonerLevel,
          summonerId: el.data.id
        }}}))
        r = [...r, ...loaded.map(el => {return {...el, data: {
          summonerName: el.data.name,
          summonerId: el.data.id
        }}})]
      }
    } else {
      /*
      if (!(/^[\w\. ]+$/.test(data))) {
        return {status: 400, error: 'api-wrname'}
      }*/
      let cache = await db.collection(`summoners-${plf}`).findOne({summonerName: new RegExp(['^', data, '$'].join(''), 'i')}, {projection: {_id: 0}})
      if (cache) return {status: 200, data: {summonerId: cache.summonerId, summonerName: cache.summonerName}}
      r = await request.single(`https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURI(data)}`, plf, 'summoner/by-name')
      if (r.status >= 400) {
        return {status: r.status}
      }
      await db.collection(`summoners-${plf}`).insertOne({
        accountId: r.data.accountId,
        puuid: r.data.puuid,
        summonerName: r.data.name,
        profileIconId: r.data.profileIconId,
        summonerLevel: r.data.summonerLevel,
        summonerId: r.data.id
      })
      r = {...r, data: {
        summonerName: r.data.name,
        summonerId: r.data.id
      }}
    }
    return r
  }
  async accountByName(plf, data) {
    let cache = await db.collection(`summoners-${plf}`).findOne({summonerName: new RegExp(['^', data, '$'].join(''), 'i')}, {projection: {_id: 0}})
    if (cache && 'accountId' in cache && 'summonerLevel' in cache && 'profileIconId' in cache)
      return {status: 200, data: cache}
    let r = await request.single(`https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURI(data)}`, plf, 'summoner/by-name')
    if(r.status === 200) {
      if (cache)
        await db.collection(`summoners-${plf}`).updateOne({summonerId: r.id}, {$set: {...cache, accountId: r.accountId, summonerLevel: r.summonerLevel, profileIconId: r.profileIconId}})
      else
        await db.collection(`summoners-${plf}`).updateOne({summonerId: r.id}, {$set: {
          summonerId: r.data.id,
          summonerName: r.data.name,
          accountId: r.data.accountId,
          summonerLevel: r.data.summonerLevel,
          profileIconId: r.data.profileIconId
        }}, {upsert: true})
      return {status: 200, data: {
        summonerId: r.data.id,
        summonerName: r.data.name,
        accountId: r.data.accountId,
        summonerLevel: r.data.summonerLevel,
        profileIconId: r.data.profileIconId
      }}
    } else {
      return r
    }
  }
  async mainPosition(plf, data) {
    try {
      var r = await request.single(`https://${plf}.api.riotgames.com/lol/match/v4/matchlists/by-account/${data}?endIndex=20`, plf, 'match/matchlists')
    } catch (e) {
      throw e
    }
    let roles = r.matches.map(el => {
      if (el.lane == 'TOP') return 'top'
      if (el.lane == 'JUNGLE') return 'jng'
      if (el.lane == 'MID') return 'mid'
      if (el.role == 'DUO_CARRY') return 'bot'
      if (el.role == 'DUO_SUPPORT') return 'sup'
    })
    let positions = {top: 0, jng: 0, mid: 0, bot: 0, sup: 0}
    roles.map(el => el && positions[el] ++)
    return Object.keys(positions).find(el => positions[el] == Math.max.apply(null, Object.values(positions)))
  }
  async matchesByAccount(plf, data, options, page=1) {
    let date = Date.now()
    if (Array.isArray(data)) {
      let urls = []
      for (let d of data) {
        urls.push({
          url: `https://${plf}.api.riotgames.com/lol/match/v4/matchlists/by-account/${Array.isArray(d) ? d[0] : d}?beginTime=${date - page*7*24*60*60*1000}&endTime=${date - ((page-1)*7*24*60*60*1000)}`,
          plf,
          method: 'match/matchlists',
          options: Array.isArray(d) ? d[1] : {}
        })
      }
      var r = (await request.multiple(urls)).map(el => {
        if (el.status >= 400) {
          if (el.status == 404) return {status: 200, data: {matches: []}}
          return {status: el.status}
        }
        return el
      })
    } else {
      options = {...{byIndex: false}, ...options}
      var r = await request.single(options.byIndex ?
        `https://${plf}.api.riotgames.com/lol/match/v4/matchlists/by-account/${data}?beginIndex=${(page - 1) * 100}&endIndex=${page * 100}`
        : `https://${plf}.api.riotgames.com/lol/match/v4/matchlists/by-account/${data}?beginTime=${date - page*7*24*60*60*1000}&endTime=${date - ((page-1)*7*24*60*60*1000)}`
        , plf, 'match/matchlists')
      if (r.status >= 400) {
        if (r.status == 404) return {status: 200, data: {matches: []}}
        return r
      }
    }
    return r
  }
  async entriesBySummoner(plf, data) {
    let r
    if (Array.isArray(data)) {
      r = []
      let urls = []
      for (let d of data) {
        urls.push({
          url: `https://${plf}.api.riotgames.com/lol/league/v4/entries/by-summoner/${d}`,
          plf,
          method: 'league/entries-by-summoner'
        })
      }
      r = await request.multiple(urls)
    } else {
      r = await request.single(`https://${plf}.api.riotgames.com/lol/league/v4/entries/by-summoner/${data}`, plf, 'league/entries-by-summoner')
    }
    return r
  }
  async entries(plf, data) {
    let r
    if (Array.isArray(data)) {
      r = []
      let urls = []
      for (let d of data) {
        urls.push({
          url: `https://${plf}.api.riotgames.com/lol/league-exp/v4/entries/${d.queue}/${d.tier}/${d.division}?page=${d.page}`,
          plf,
          method: 'league/entries',
          options: {retry: true}
        })
      }
      r = await request.multiple(urls)
    } else {
      r = await request.single(`https://${plf}.api.riotgames.com/lol/league-exp/v4/entries/${data.queue}/${data.tier}/${data.division}?page=${data.page}`, plf, 'league/entries', {retry: true})
    }
    //console.log(plf, data.tier, data.division, data.page)
    return r
  }
  async matches(plf, data) {
    let r
    if (Array.isArray(data)) {
      r = []
      if (!data.length) return []
      let urls = []
      for (let [i, d] of data.entries()) {
        let cached = await db.collection(`matches-${plf}`).findOne({gameId: d})
        if (cached) {
          r[i] = {status: 200, data: cached, i}
          continue
        }
        urls.push({
          url: `https://${plf}.api.riotgames.com/lol/match/v4/matches/${d}`,
          plf,
          method: 'match/matches',
          i
        })
      }
      if (urls.length) {
        let loaded = await request.multiple(urls)
        //console.log(loaded.map(el => el ? '+' : '-'))
        r = [...r, ...loaded]
        if (loaded.filter(el => el.status == 200).length)
          await db.collection(`matches-${plf}`).insertMany(loaded.filter(el => el.status == 200).map(el => el.data))
      }
      r.sort((x, y) => x.i - y.i).filter(Boolean).map(el => delete el.i)
      r = r.filter(Boolean)
    } else {
      r = await request.single(`https://${plf}.api.riotgames.com/lol/match/v4/matches/${data}`, plf, 'match/matches')
    }
    return r
  }
  async timelines(plf, data) {
    let r
    if (Array.isArray(data)) {
      r = []
      if (!data.length) return []
      let urls = []
      for (let [i, d] of data.entries()) {
        urls.push({
          url: `https://${plf}.api.riotgames.com/lol/match/v4/timelines/by-match/${d}`,
          plf,
          method: 'match/timelines',
          i
        })
      }
      if (urls.length) {
        let loaded = await request.multiple(urls)
        //console.log(loaded.map(el => el ? '+' : '-'))
        r = [...r, ...loaded]
      }
    } else {
      r = await request.single(`https://${plf}.api.riotgames.com/lol/match/v4/timelines/by-match/${data}`, plf, 'match/timelines')
    }
    r.sort((x, y) => x.i - y.i).map(el => delete el.i)
    return r
  }
  async fullMatch(plf, data) {
    let [matches, timeliness] = await Promise.all([await this.matches(plf, data), await this.timelines(plf, data)])
    return matches.map((match, i) => {
      let timelines = timeliness[i]
      let status
      if (match.status !== 200)
        status = match.status
      else if (timelines.status !== 200)
        status = timelines.status
      else
        status = 200
      return {status, data: {match: match.data, timelines: timelines.data}}
    })
  }
  async activeGame(plf, data) {
    return await request.single(`https://${plf}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${data}`, plf, 'spectator/active-games')
  }
}
module.exports = new Api()