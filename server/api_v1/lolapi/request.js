const fetch = require('node-fetch')

const wsm = require('../../ws/wsm')
const limiting = require('./limiting')
const sleep = require('../../utils/sleep')
const store = require('../../store')

let riotapikey = store.getState().riotapikey
store.subscribe(() => riotapikey = store.getState().riotapikey)

class Request {
  constructor() {
    this.apiKeyExpired = false
  }
  async single(url, plf=null, method=null, inputOptions={}, tries=0) {
    console.log(url)
    let options = {...{retry: true, ignore404: false, tries: 3}, ...inputOptions}
    let st = Date.now()
    if (this.apiKeyExpired) return {status: 419}
    if (plf && method) await limiting.iteration(plf, method)
    let rres
    try {
      rres = await fetch(url, {headers: {'X-Riot-Token': riotapikey}})
    } catch (e) {
      if (tries >= options.tries) {
        return {status: 500, message: e.message}
      }
      await sleep(2500)
      return this.single(url, plf, method, inputOptions, tries + 1)
    }
    let res = {status: rres.status, headers: rres.headers, data: await rres.json()}
    if (res.status >= 400) {
      console.log(res.status, res.headers)
      console.log(`RiotAPI request\t| ${plf}\t| ${method}\t| ${res.status}\t| ${Date.now() - st}`)
      if (res.status == 429) {
        if (res.headers.get('Retry-After')) {
          if (res.headers.get('x-rate-limit-type') === 'application')
            limiting.reset(plf, 'global', parseInt(res.headers.get('Retry-After')))
          else if (res.headers.get('x-rate-limit-type') === 'method')
            limiting.reset(plf, method, parseInt(res.headers.get('Retry-After')))
          await sleep(res.headers.get('Retry-After') * 1000 + 1000)
          return this.single(url, plf, method, inputOptions)
        } else {
          await sleep(5000)
          return this.single(url, plf, method, inputOptions)
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
        if (options.retry) {
          await sleep(2500)
          return this.single(url, plf, method, inputOptions)
        } else {
          return {status: res.status}
        }
      }
    }
    //console.log(`RiotAPI request\t| ${plf}\t| ${method}\t| ${res.status}\t| ${Date.now() - st}`)
    return options.saved ? {status: 200, data: res.data, saved: options.saved} : {status: 200, data: res.data}
  }
  async multiple(requests) {
    let r = []
    for (let i = 0; i < requests.length; i += 10) {
      let requestsPool = requests.slice(i, i + 10)
      try {
        r = [...r, ...await Promise.all(requestsPool.map(async req => {return {...await this.single(req.url, req.plf, req.method, req.options || {}), ...req.i && {i: req.i}}}))]
      } catch (e) {
        return {status: 500, message: e}
      }
    }
    return r
  }
}
module.exports = new Request()