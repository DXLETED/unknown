const fetch = require('node-fetch')
const wsm = require('../ws/wsm')
const REGIONS = require('../constants/regions')
const config = require('../../env/config')
const db = require('../db')()

methods = {
  'summoner': {
    'by-name': {
      'regions': {
        'br1': 1300, 'eun1': 1600, 'euw1': 2000, 'jp1': 800, 'kr': 2000, 'la1': 1000, 'la2': 1000, 'na1': 2000, 'oc1': 800, 'tr1': 1300, 'ru': 600
      },
      'timeout': 60
    },
    'by-puuid': {
      'regions': {
        'br1': 1300, 'eun1': 1600, 'euw1': 2000, 'jp1': 800, 'kr': 2000, 'la1': 1000, 'la2': 1000, 'na1': 2000, 'oc1': 800, 'tr1': 1300, 'ru': 600
      },
      'timeout': 60
    },
    'by-account': {
      'regions': {
        'br1': 1300, 'eun1': 1600, 'euw1': 2000, 'jp1': 800, 'kr': 2000, 'la1': 1000, 'la2': 1000, 'na1': 2000, 'oc1': 800, 'tr1': 1300, 'ru': 600
      },
      'timeout': 60
    }
  },
  'match': {
    'matches': {
      'global': 500,
      'timeout': 10
    },
    'timelines': {
      'global': 500,
      'timeout': 10
    },
    'matchlists': {
      'global': 1000,
      'timeout': 10
    }
  },
  'spectator': {
    'active-games': {
      'global': 20000,
      'timeout': 10
    },
    'featured-games': {
      'global': 20000,
      'timeout': 10
    }
  },
  'league': {
    'entries': {
      'global': 10,
      'timeout': 2
    },
    'entries-by-summoner': {
      'regions': {
        'br1': 90, 'eun1': 165, 'euw1': 300, 'jp1': 35, 'kr': 90, 'la1': 80, 'la2': 80, 'na1': 270, 'oc1': 55, 'tr1': 60, 'ru': 35
      },
      'timeout': 60
    }
  },
  'champion-mastery': {
    'by-summoner': {
      'global': 20000,
      'timeout': 10
    },
    'by-summoner/champion': {
      'global': 20000,
      'timeout': 10
    }
  }
}

let limits = {}
for (region in REGIONS) {
  let platform = REGIONS[region]
  limits[platform] = {
    'global/s': {
      'count': 20,
      'limit': 20,
      'timeout': 1,
      'drop': 0
    },
    'global/l': {
      'count': 100,
      'limit': 100,
      'timeout': 120,
      'drop': 0
    }
  }
  for (method in methods) {
    for (let [query_name, query] of Object.entries(methods[method])) {
      if ('global' in query) {
        limits[platform][method + '/' + query_name] = {
          'count': query['global'],
          'limit': query['global'],
          'timeout': query['timeout'],
          'drop': 0
        }
      } else {
        limits[platform][method + '/' + query_name] = {
          'count': query['regions'][platform],
          'limit': query['regions'][platform],
          'timeout': query['timeout'],
          'drop': 0
        }
      }
    }
  }
}

sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

class Lolapi {
  constructor(api_key) {
    this.api_key = api_key
    this.apiKeyExpired = false
  }
  limits() {
    return {'time': Date.now(), 'regions': limits}
  }
  platform(rg) {
    if (rg in REGIONS) {
      return REGIONS[rg]
    } else {
      throw 415
    }
  }
  async statusTest() {
    try {
      await this.request('https://ru.api.riotgames.com/lol/status/v3/shard-data')
    } catch {
      return false
    }
    return true
  }
  async summonerByName(plf, data) {
    if (!(/^[\w\. ]+$/.test(data))) {
      throw {status: 411, error: 'Wrong name'}
    }
    let cache = await db.collection(`summoners-${plf}`).findOne({summonerName: new RegExp(data, 'i')}, {projection: {_id: 0}})
    if (cache)
      return cache
    try {
      var r = await this.request(`https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${data}`, plf, 'summoner/by-name')
      await db.collection(`summoners-${plf}`).updateOne({summonerId: r.id}, {$set: {
        summonerId: r.id,
        summonerName: r.name,
        accountId: r.accountId,
        summonerLevel: r.summonerLevel,
        profileIconId: r.profileIconId
      }}, {upsert: true})
    } catch (e) {
      throw e
    }
    return await db.collection(`summoners-${plf}`).findOne({summonerName: new RegExp(data, 'i')}, {projection: {_id: 0}})
  }
  async accountByName(plf, data) {
    if (!(/^[\w\. ]+$/.test(data))) {
      throw {status: 411, error: 'Wrong name'}
    }
    let cache = await db.collection(`summoners-${plf}`).findOne({summonerName: new RegExp(data, 'i')}, {projection: {_id: 0}})
    if (cache && 'accountId' in cache && 'summonerLevel' in cache && 'profileIconId' in cache)
      return cache
    try {
      var r = await this.request(`https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${data}`, plf, 'summoner/by-name')
    } catch (e) {
      throw e
    }
    if (cache)
      await db.collection(`summoners-${plf}`).updateOne({summonerId: r.id}, {$set: {...cache, accountId: r.accountId, summonerLevel: r.summonerLevel, profileIconId: r.profileIconId}})
    else
      await db.collection(`summoners-${plf}`).updateOne({summonerId: r.id}, {$set: {
        summonerId: r.id,
        summonerName: r.name,
        accountId: r.accountId,
        summonerLevel: r.summonerLevel,
        profileIconId: r.profileIconId
      }}, {upsert: true})
    return await db.collection(`summoners-${plf}`).findOne({summonerName: new RegExp(data, 'i')})
  }
  async mainPosition(plf, data) {
    try {
      var r = await this.request(`https://${plf}.api.riotgames.com/lol/match/v4/matchlists/by-account/${data}?endIndex=20`, plf, 'match/matchlists')
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
  async matchesByAccount(plf, data, page=1) {
    let date = Date.now()
    if (Array.isArray(data)) {
      let urls = []
      for (let d of data) {
        urls.push([`https://${plf}.api.riotgames.com/lol/match/v4/matchlists/by-account/${d}?beginTime=${date - page*7*24*60*60*1000}&endTime=${date - ((page-1)*7*24*60*60*1000)}`, plf, 'match/matchlists'])
      }
      var r = (await this.mrequest(urls)).map(el => {
        if (el.status >= 400) {
          if (el.status == 404) return {status: 200, data: {matches: []}}
          return {status: el.status}
        }
        return el
      })
    } else {
      try {
        var r = (await this.request(`https://${plf}.api.riotgames.com/lol/match/v4/matchlists/by-account/${data}?beginTime=${date - page*7*24*60*60*1000}&endTime=${date - ((page-1)*7*24*60*60*1000)}`, plf, 'match/matchlists')).matches
      } catch (e) {
        if (e == 404)
          return []
        else
          throw e
      }
    }
    return r
  }
  async MsummonerByName(plf, data) {
    if (Array.isArray(data)) {
      let urls = []
      for (let d of data) {
        if (!(/^[\w\. ]+$/.test(d))) {
          throw 411
        }
        urls.push([`https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${d}`, plf, 'summoner/by-name'])
      }
      try {
        var r = await this.mrequest(urls)
      } catch (e) {
        throw e
      }
    } else {
      if (!(/^[\w\. ]+$/.test(data))) {
        throw 411
      }
      try {
        var r = await this.request(`https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${data}`, plf, 'summoner/by-name')
      } catch (e) {
        throw e
      }
    }
    return r
  }
  async entriesBySummoner(plf, data) {
    if (Array.isArray(data)) {
      let urls = []
      for (let d of data) {
        urls.push([`https://${plf}.api.riotgames.com/lol/league/v4/entries/by-summoner/${d}`, plf, 'league/entries-by-summoner'])
      }
      var r = (await this.mrequest(urls)).map(el => {
        if (el.status >= 400) {
          return {status: el.status}
        }
        return el
      })
    } else {
      try {
        var r = await this.request(`https://${plf}.api.riotgames.com/lol/league/v4/entries/by-summoner/${data}`, plf, 'league/entries-by-summoner')
      } catch (e) {
        throw e
      }
    }
    return r
  }
  async entries(plf, data) {
    if (Array.isArray(data)) {
      let urls = []
      for (let d of data) {
        urls.push([`https://${plf}.api.riotgames.com/lol/league-exp/v4/entries/${d.queue}/${d.tier}/${d.division}?page=${d.page}`, plf, 'league/entries'], {retry: true})
      }
      try {
        var r = await this.mrequest(urls)
      } catch (e) {
        throw e
      }
    } else {
      try {
        var r = await this.request(`https://${plf}.api.riotgames.com/lol/league-exp/v4/entries/${data.queue}/${data.tier}/${data.division}?page=${data.page}`, plf, 'league/entries', {retry: true})
      } catch (e) {
        throw e
      }
    }
    //console.log(plf, data.tier, data.division, data.page)
    return r
  }
  async matches(plf, data) {
    let r = []
    if (Array.isArray(data)) {
      if (!data.length) return []
      let urls = []
      for (let [i, d] of data.entries()) {
        let cached = await db.collection(`matches-${plf}`).findOne({gameId: d})
        if (cached) {
          r[i] = {status: 200, data: cached}
          continue
        }
        urls.push([`https://${plf}.api.riotgames.com/lol/match/v4/matches/${d}`, plf, 'match/matches'])
      }
      if (urls.length) {
        let loaded = await this.mrequest(urls)
        //console.log(loaded.map(el => el ? '+' : '-'))
        r = [...r, ...loaded]
        await db.collection(`matches-${plf}`).insertMany(loaded.filter(el => el.status == 200).map(el => el.data))
      }
    } else {
      try {
        r = await this.request(`https://${plf}.api.riotgames.com/lol/match/v4/matches/${data}`, plf, 'match/matches')
      } catch (e) {
        throw e
      }
    }
    return r
  }
  async activeGame(plf, data) {
    try {
      var r = await this.request(`https://${plf}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${data}`, plf, 'spectator/active-games')
    } catch(e) {
      throw e
    }
    return r
  }
  matchInfo() {
    return false
  }
  async request(url, plf=false, method=false, params={retry: false}) {
    let st = Date.now()
    if (this.apiKeyExpired) throw 419
    if (plf && method) await this.limiting(plf, method)
    try {
      var res = await fetch(url, {headers: {'X-Riot-Token': this.api_key}})
    } catch(e) {
      console.log(e)
      return this.request(url, plf, method)
    }
    if (res.status >= 400) {
      console.log(res.status, res.headers)
      console.log(`RiotAPI request\t| ${plf}\t| ${method}\t| ${res.status}\t| ${Date.now() - st}`)
      if (res.status == 429) {
        if (res.headers.get('Retry-After')) {
          await sleep(res.headers.get('Retry-After') * 1000)
          //clear limits
          return this.request(url, plf, method)
        } else {
          await sleep(5000)
          return this.request(url, plf, method)
        }
      }
      if (res.status == 403) {
        this.apiKeyExpired = true
        throw 419
      }
      if (res.status >= 400 && res.status < 500) {
        throw res.status
      }
      if (res.status >= 500) {
        if (params.retry) {
          await sleep(2500)
          return this.request(url, plf, method)
        } else {
          throw res.status
        }
      }
    }
    let r = await res.json()
    console.log(`RiotAPI request\t| ${plf}\t| ${method}\t| ${res.status}\t| ${Date.now() - st}`)
    return r
  }
  async mrequest(requests, params={retry: false, ignore404: false}) {
    if (this.apiKeyExpired) return 419
    let r = []
    for (let i = 0; i < requests.length; i += 20) {
      let requestsPool = Array.apply(null, {length: 20}).map((el, ii) => requests[i + ii]).filter(el => el && el)
      try {
        await Promise.all(requestsPool.map(async req => {
          await this.limiting(req[1], req[2])
          return fetch(encodeURI(req[0]), {headers: {'X-Riot-Token': this.api_key}})
          .then(async res => {return {status: res.status, headers: res.headers, data: await res.json()}})
          .then(async res => {
            if (res.status >= 400) {
              console.log(res.status, res.headers)
              if (res.status == 429) {
                if (res.headers.get('Retry-After')) {
                  await sleep(res.headers.get('Retry-After') * 1000)
                  //clear limits
                  return this.mrequest(requests)
                } else {
                  await sleep(5000)
                  return this.mrequest(requests)
                }
              }
              if (res.status == 403) {
                this.apiKeyExpired = true
                return {status: 419}
              }
              if (res.status >= 400 && res.status < 500) {
                return {status: res.status}
              }
              if (res.status >= 500) {
                if (params.retry) {
                  await sleep(2500)
                  return this.mrequest(requests, params)
                } else {
                  return {status: res.status}
                }
              }
            }
            r.push({status: res.status, data: res.data})
          })
          .catch(async () => {
            await sleep(2500)
            return this.mrequest(requests, params)
          })
        }))
      } catch (e) {
        return {status: 500, message: e}
      }
    }
    return r
  }
  async limiting(plf, method) {
    let mtds = ['global/s', 'global/l', method]
    for (let mtd of mtds) {
      if (limits[plf][mtd]['count'] < 1 && Date.now() < limits[plf][mtd]['drop']) {
        await sleep(limits[plf][mtd]['drop'] - Date.now())
        return this.limiting(plf, method)
      }
    }
    for (let mtd of mtds) {
      if (Date.now() >= limits[plf][mtd]['drop']) {
        limits[plf][mtd]['count'] = limits[plf][mtd]['limit']
        limits[plf][mtd]['drop'] = Date.now() + limits[plf][mtd]['timeout'] * 1000 + 1000
      }
    }
    for (let mtd of mtds) {
      limits[plf][mtd]['count'] -= 1
    }
    wsm.send('limits', JSON.stringify({time: Date.now(), regions: limits}))
  }
}

Api = new Lolapi(config.RIOT_API_KEY)
module.exports = Api