const wsm = require('../../ws/wsm')
const REGIONS = require('../../constants/regions')
const {isMainThread, parentPort, workerData} = require('worker_threads')

const sleep = require('../../utils/sleep')

if (!isMainThread) {
  var id = 0
}

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

class Limiting {
  get(plf, method) {
    return {'global/s':limits[plf]['global/s'], 'global/l':limits[plf]['global/l'], [method]: limits[plf][method]}
  }
  getAll() {
    return {'time': Date.now(), 'regions': limits}
  }
  async iteration (plf, method) {
    if (isMainThread) {
      let mtds = ['global/s', 'global/l', method]
      for (let mtd of mtds) {
        if (limits[plf][mtd]['count'] < 1 && Date.now() < limits[plf][mtd]['drop']) {
          await sleep(limits[plf][mtd]['drop'] - Date.now())
          return this.iteration(plf, method)
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
    } else {
      return new Promise(res => {
        let cId = `${workerData.name}-${id}`
        id ++
        parentPort.postMessage({type: 'LIMITING', id: cId, plf, method})
        let listener = msg => {
          if (msg.type === 'LIMITING' && msg.id === cId) {
            parentPort.removeListener('message', listener)
            res()
          }
        }
        parentPort.on('message', listener)
      })
    }
  }
  //clear (plf, method)
}
module.exports = new Limiting()