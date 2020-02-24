import './css/init.scss'
import './css/default'

import React, { Fragment, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { createStore, bindActionCreators, applyMiddleware } from 'redux'
import { connect, Provider, useSelector } from 'react-redux'
import { BrowserRouter as Router, Route, Switch as RouterSwitch } from 'react-router-dom'

import assets, { cpl } from './assets'
import { Header, Select } from './header'
import { MainOverlay } from './components/main-search'
import { Live } from './live'
import { Modal } from './modules/modal'
import { Switch } from './components/switch'

/*
import history from './history'
const location = history.location
history.listen((location, action) => {
  console.log(action, location.pathname, location.state)
})
//history.push('/home')
setTimeout(function() {
  history.push('/')
}, 2000)
*/
document.createElement("p").style.flex && console.log('BROWSER NOT SUPPOTED')
const initialState = {settings: {}, menus: {}, switchmenu: {}, location: window.location.pathname}
function todos(state = {}, action) {
  switch (action.type) {
    case 'UPDATE_SETTINGS': 
      return {...state, settings: {...state.settings, ...action.data}}
    case 'UPDATE_LOCATION':
      return {...state, location: action.data}
    case 'UPDATE_MENU':
      return {...state, menus: {...state.menus, ...action.data}}
    case 'UPDATE_SWITCHMENU':
      return {...state, switchmenu: {...state.switchmenu, ...action.data}}
    default:
      return state
  }
}
const store = createStore(todos, initialState)
console.log('storeInit', store.getState())
// const unsubscribe = store.subscribe(() => {console.log('store', store.getState())})
store.dispatch({
  type: 'UPDATE_SETTINGS',
  data: {}
})

const Main = () => {
  console.log(assets)
  return (
    <Provider store={store}>
      <Router>
        <Header />
          <Route exact path="/">
            <div id="main" className="page">
              <main>
                <div id="mainbg">
                  <img src="/static/img/main-bg/Diana.jpg" />
                  <div id="mainbg-pattern"></div>
                  <div id="mainbg-shadow"></div>
                </div>
                <div id="overlay-wr">
                  <MainOverlay />
                  <div id="overlay-bgchange">
                    <Select className="" id="bgchange" selected="Diana" color="bl" dropdown={
                      ['Diana']
                    } />
                    <Switch akey='mainbg-video' label='Enable video' />
                  </div>
                </div>
              </main>
              <footer>
                <div id="terms">© Copyright llolstats.gg. All rights reserved. llolstats.net isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.</div>
              </footer>
            </div>
          </Route>
          <Route path="/live/" component={Live} />
      </Router>
    </Provider>
  )
}
Promise.all([cpl]).then(() => ReactDOM.render(<Main />, document.getElementsByTagName('root')[0]))

var imgs = [],
    len = imgs.length,
    counter = 0,
    imgsrcs = []

window.images = []
const assetsLoader = (assets, callback = () => {}) => {
  let loaded = 0
  let headersLoaded = 0
  let count = assets.length
  let generalContentLength = 0
  for (let asset of assets) {
    let contentLength = 0
    fetch(asset)
      .then(response => {
        contentLength = response.headers.get("Content-Length")
        headersLoaded ++
        generalContentLength += parseInt(contentLength)
        if (headersLoaded == count) {
          console.log(`Images size: ${Math.round(generalContentLength / 1024)} kB`)
        }
        return response.text()
      })
      .then(response => {
        let img = new Image()
        img.src = asset
        window.images.push(img)
        loaded ++
        if (loaded == count) {
          callback()
        }
      })
  }
}

imgsrcs.push('/static/img/main-bg/Diana.jpg',
  '/static/img/pattern.png',
  '/static/img/champion-splashes/498.jpg',
  '/static/img/positions/Position_Plat-Bot.png'
)
console.log(imgsrcs)
assetsLoader(imgsrcs)