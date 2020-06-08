import './css/init.scss'
import Axios from 'axios'
import cookie from 'react-cookies'

import loadList from '../static/data/loadList.json'

global.assets = {}
window.images = []

window.onload = () => {
  let script
  let loaded = {scripts: false, assets: false, images: false}
  const updateLoaded = type => {
    loaded[type] = true
    if (Object.values(loaded).every(Boolean)) {
      const el = document.createElement('script')
      el.innerHTML = script
      el.setAttribute('src', '/static/js/main.js')
      document.body.appendChild(el)
      setTimeout(() => {
        document.getElementById('preload').classList.add('hide')
      }, 250)
    }
  }

  Axios.get('/static/js/main.js', {
    onDownloadProgress: e => {
      document.querySelector('.scripts > .bar > .status').style.width = e.loaded / e.total * 100 + '%'
    }
  })
    .then(res => {
      script = res.data
      updateLoaded('scripts')
    })

  let assetsLoaded = []
  let assetsLength
  Promise.all(Object.values(loadList.assets).map(src =>
    Axios.head(src)
  ))
    .then(ress => assetsLength = ress.map(res => parseInt(res.headers['content-length'])).reduce((x, y) => x + y))
  Promise.all(Object.entries(loadList.assets).map(([title, src], i) => {
    return Axios.get(src, {
      responseType: 'json',
      onDownloadProgress: e => {
        assetsLoaded[i] = e.loaded
        if (assetsLength)
          document.querySelector('.assets > .bar > .status').style.width = assetsLoaded.reduce((x, y) => x + y) / assetsLength * 100 + '%'
      }
    })
      .then(res => global.assets[title] = res.data)
  }))
    .then(() => {
      updateLoaded('assets')
    })
  
  let settings = cookie.load('settings')
  if (settings && 'bgimage' in settings)
    loadList.images.push(`/static/img/main-bg/${settings.bgimage}.jpg`)
  else
    loadList.images.push(`/static/img/main-bg/0.jpg`)
  let imgLoaded = 0
  let imgLength = {}
  Promise.all(Object.values(loadList.images).map(src =>
    Axios.head(src)
  ))
    .then(ress => ress.map(res => imgLength[res.config.url] = parseInt(res.headers['content-length'])))
    .then(() => {
      Promise.all(
        loadList.images.map((src, i) => {
          let img = new Image()
          img.src = src
          img.onload = () => {
            imgLoaded += imgLength[src]
            document.querySelector('.images > .bar > .status').style.width = imgLoaded / Object.values(imgLength).reduce((x, y) => x + y) * 100 + '%'
          }
          window.images.push(img)
        })
      )
        .then(() => updateLoaded('images'))
    })
}