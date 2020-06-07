import './css/init.scss'
import Axios from 'axios'

let script
let loaded = {scripts: false, assets: false, images: false}
const updateLoaded = type => {
  loaded[type] = true
  if (Object.values(loaded).every(Boolean)) {
    const el = document.createElement('script')
    el.innerHTML = script
    //document.body.appendChild(el)
    setTimeout(() => {
      document.getElementById('preload').classList.add('hide')
      //document.querySelector('.page').classList.remove('hide')
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

let srcs = {
  champions: '/static/data/en_US/champions.json',
  сhampionLocales: '/static/data/championLocales.json',
  items: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json',
  runes: '/static/json/runesReforged.json',
  championStats: '/api/v1/stats/championsFull'
}

let assets = {}
Promise.all(Object.keys(srcs).map(el => {
    return Axios.get(srcs[el], {
      onDownloadProgress: e => {
        document.querySelector('.assets > .bar > .status').style.width = e.loaded / e.total * 100 + '%'
      }
    })
      .then(res => assets[el] = res.data)
  })
).then(() => {
  updateLoaded('assets')
})

updateLoaded('images')
let imgsrcs = [
  '/static/img/pattern.png',
  '/static/img/done.png',
  '/static/img/banned-wh.png',
  '/static/img/cs.png',
  '/static/img/star-wh.png',
  '/static/img/ward.png',
  '/static/img/arrow/white_down.png',
  '/static/img/arrow/white_right.png',
  '/static/img/arrow/white_up.png',
  '/static/img/header/language.png',
  '/static/img/header/menu_white.png',
  '/static/img/header/settings_white.png'
]
window.images = []
let imgLoaded = []
let imgTotal = []
Promise.all(
  imgsrcs.map((asset, i) => {
    return Axios.get(asset, {
      onDownloadProgress: (e) => {
        imgLoaded[i] = e.loaded
        imgTotal[i] = e.total
        document.querySelector('.images > .bar > .status').style.width = imgLoaded.reduce((x, y) => x + y) / imgTotal.reduce((x, y) => x + y) * 100 + '%'
      }})
      .then(res => {
        let img = new Image()
        img.src = asset
        window.images.push(img)
      })
  })
)
  .then(() => updateLoaded('images'))