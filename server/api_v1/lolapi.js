const fetch = require('node-fetch')
const wsm = require('../ws/wsm')

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
      'global': 20000,
      'timeout': 10
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

regions = {
  'br': 'br1',
  'eune': 'eun1',
  'euw': 'euw1',
  'jp': 'jp1',
  'kr': 'kr',
  'lan': 'la1',
  'las': 'la2',
  'na': 'na1',
  'oce': 'oc1',
  'tr': 'tr1',
  'ru': 'ru'
}

limits = {}
for (region in regions) {
  let platform = regions[region]
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
    if (rg in regions) {
      return regions[rg]
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
      throw 411
    }
    try {
      var r = await this.request(`https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${data}`, plf, 'summoner/by-name')
    } catch (e) {
      throw e
    }
    return r
  }
  async MsummonerByName(plf, data) {
    let urls = []
    for (let d of data) {
      urls.push([`https://${plf}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${d}`, plf, 'summoner/by-name'])
    }
    try {
      var r = await this.mrequest(urls)
    } catch (e) {
      throw e
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
  async request(url, plf=false, method=false) {
    if (this.apiKeyExpired) throw 419
    if (plf && method) await this.limiting(plf, method)
    let res = await fetch(url, {headers: {'X-Riot-Token': this.api_key}})
    if (res.status >= 400) {
      if (res.status == 429) {
        ra = res.headers.get('Retry-After')
        await sleep(ra * 1000)
        return this.request(url, plf, method)
      }
      if (res.status == 403) {
        this.apiKeyExpired = true
        throw 419
      }
      throw res.status
    }
    let r = await res.json()
    return r
  }
  async mrequest(requests) {
    if (this.apiKeyExpired) return 419
    let r = []
    await Promise.all(requests.map(async req => {
      await this.limiting(req[1], req[2])
      return fetch(encodeURI(req[0]), {headers: {'X-Riot-Token': this.api_key}})
        .then(res => res.json())
        .then(async res => {
          if (res.status >= 400) {
            if (res.status == 429) {
              ra = res.headers.get('Retry-After')
              await sleep(ra * 1000)
              throw this.mrequest(requests)
            }
            if (res.status == 403) {
              this.apiKeyExpired = true
              throw 419
            }
            throw res.status
          }
          r.push(res)
        })
    }))
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

Api = new Lolapi('RGAPI-8a83ebbe-4c15-4939-8637-6e92db72a387')
module.exports = Api