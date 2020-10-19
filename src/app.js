import './css/default'

import React, { Fragment, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { createStore, bindActionCreators, applyMiddleware } from 'redux'
import { connect, Provider, useSelector } from 'react-redux'
import { BrowserRouter as Router, Route, Switch as RouterSwitch } from 'react-router-dom'

import { Header } from './modules/header'
import { MainOverlay } from './components/main-search'
import { Live } from './live'
import { Summoners } from './modules/summoners'
import { Statistics } from './modules/statistics'
import { Modal } from './modules/modal'
import { Switch } from './components/switch'
import { Select } from './components/select'

document.createElement("p").style.flex && console.log('BROWSER NOT SUPPOTED')
const initialState = {settings: {}, menus: {}, switchmenu: {}, location: window.location.pathname, loading: 0}
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
    case 'UPDATE_LOADING':
      if (Math.abs(action.data - state.loading) > 0.005 || action.data === 1)
      return {...state, loading: action.data}
    case 'SET':
      return {...state, ...action.data}
    default:
      return state
  }
}
const store = createStore(todos, initialState)
console.log('storeInit', store.getState())
// const unsubscribe = store.subscribe(() => {console.log('store', store.getState())})
import cookieSync from './components/cookies'
import { Loading } from './components/loading'
import Axios from 'axios'
cookieSync(store, ['settings'])

window.images = []
/*const assetsLoader = (assets) => {
  let loaded = []
  let total = []
  let loadedCount = 0
  return Promise.all(
    assets.map((asset, i) => {
      return Axios.get(asset, {
        onDownloadProgress: (progressEvent) => {
          loaded[i] = progressEvent.loaded
          total[i] = progressEvent.total
          if (progressEvent.loaded === progressEvent.total)
            loadedCount ++
          if (loadedCount === assets.length)
            store.dispatch({type: 'UPDATE_LOADING', data: 1})
          else
            store.dispatch({type: 'UPDATE_LOADING', data: loaded.reduce((x, y) => x + y) / 14819689})
        }})
        .then(() => {
          let img = new Image()
          img.src = asset
          window.images.push(img)
        })
    })
  )
}*/

const MainPage = () => {
  const settings = useSelector(state => state.settings)
  return (
    <div id="main" className="page hide">
      <main>
        <div id="mainbg">
          <img src={`/static/img/main-bg/${settings.bgimage}.jpg`} />
          <div id="mainbg-pattern"></div>
          <div id="mainbg-shadow"></div>
        </div>
        <div id="overlay-wr">
          <MainOverlay />
          <div id="overlay-bgchange">
            <Select className="" id="bgchange" akey="bgimage" defaultValue={0} color="bl" dropdown={
              ['Default', 'Diana', 'Kayn']
            } />
            <Switch akey='mainbg-video' label='Enable video' />
          </div>
        </div>
      </main>
      <footer>
        <div id="terms">© Copyright ?????.net. All rights reserved. ?????.net isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.</div>
      </footer>
    </div>
  )
}

const Main = () => {
  useEffect(() => {
    if (store.getState().settings.imgpreload !== false) {
      let imgStage2 = [
        ...Object.values(assets.champions).map(champ => [`/static/img/champion-splashes/${champ.key}.jpg`, `/static/img/champion/${champ.image.full}`]).flat(),
        ...Object.values(assets.items).filter(item => item.inStore).map(item => `/static/img/items/${item.id}.png`)
      ]
      let imgLoaded = 0
      let imgLength = {}
      Promise.all(Object.values(imgStage2).map(src =>
        Axios.head(src)
      ))
        .then(ress => ress.map(res => imgLength[res.config.url] = parseInt(res.headers['content-length'])))
        .then(() => {
          Promise.all(
            imgStage2.map((src, i) => {
              let img = new Image()
              img.onload = () => {
                imgLoaded += imgLength[src]
                store.dispatch({type: 'UPDATE_LOADING', data: imgLoaded / Object.values(imgLength).reduce((x, y) => x + y)})
              }
              img.src = src
              window.images.push(img)
            })
          )
        })
    }
    document.querySelector('.page').classList.remove('hide')
  }, [])
  return (
    <Provider store={store}>
      <Router>
        <Header />
        <Route exact path="/" component={MainPage} />
        <Route path="/summoners" component={Summoners} />
        <Route path="/statistics" component={Statistics} />
        <Route path="/live" component={Live} />
      </Router>
    </Provider>
  )
}
console.log(assets)
ReactDOM.render(<Main />, document.getElementsByTagName('root')[0])