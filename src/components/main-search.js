import React, { useState, useEffect, useRef, forceUpdate, useCallback } from 'react'
import ReactDOM from 'react-dom'
import assets from '../assets'
import { cssRh } from './cssvars'
import Velocity from 'velocity-animate'
import { DoubleScrollbar } from './double-scrollbar'
import { NavLink as Link, useHistory } from 'react-router-dom'
import rgs from './regions'
console.log(assets)

export const MainOverlay = props => {
  const [focus, setFocus] = useState(false)
  const history = useHistory()
  let focusRef = useRef()
  let resultsFocusRef = useRef(false)
  const searchRef = useRef()
  const [pos, setPos] = useState({scroll: false})
  let resultsRef = useRef()
  let posRef = useRef()
  let inputFocusRef = useRef(false)
  const setPosMouse = data => setPos({...data, scroll: false})
  const setPosKb = data => setPos({...data, scroll: true})
  let searchResultsRef = useRef()
  let refs = useRef({items: [], summoners: []})
  let scrollTopRef = useRef(0)
  let mouseLock = useRef(false)
  let updateScroll = useRef()
  let loadSummoners = useRef()
  let lastValue = useRef()
  const forceUpdate = useState()[1]
  const [results, setResults] = useState({
    items: [],
    summoners: []
  })
  const updateResults = data => {
    resultsRef.current = {...resultsRef.current, ...data}
    setResults(resultsRef.current)
  }
  const update = e => {
    if (!e.target.closest('#search') && !e.target.closest('#search-results'))
      setFocus(false)
  }
  const nav = e => {
    if (focusRef && !(searchRef.current == document.activeElement)) {
      if (e.keyCode == 38 || e.keyCode == 40)
        e.preventDefault()
      switch (e.keyCode) {
        case 65:
        case 37:
          if (posRef.current) {
            if (resultsRef.current[posRef.current.cat][posRef.current.i - 1])
              setPosKb({...posRef.current, i: posRef.current.i - 1})
            else if (resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]] && resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]].length)
              setPosKb({cat: Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1], i: resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]].length - 1})
          } else
            for(let key of Object.keys(resultsRef.current))
              if (resultsRef.current[key].length) {
                setPosKb({cat: key, i: 0})
                break
              }
          break
        case 68:
        case 39:
          if (posRef.current) {
            if (resultsRef.current[posRef.current.cat][posRef.current.i + 1])
              setPosKb({...posRef.current, i: posRef.current.i + 1})
            else if (resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) + 1]] && resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) + 1]].length)
              setPosKb({cat: Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) + 1], i: 0})
          } else
            for(let key of Object.keys(resultsRef.current))
              if (resultsRef.current[key].length) {
                setPosKb({cat: key, i: 0})
                break
              }
          break
        case 87:
        case 38:
          if (posRef.current) {
            if (resultsRef.current[posRef.current.cat][posRef.current.i - 3])
              setPosKb({...posRef.current, i: posRef.current.i - 3})
            else if (resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]] && resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]].length)
              if (resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]][Math.ceil(resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]].length / 3) * 3 + (posRef.current.i - 3)])
                setPosKb({cat: Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1], i: Math.ceil(resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]].length / 3) * 3 + (posRef.current.i - 3)})
              else
                setPosKb({cat: Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1], i: resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) - 1]].length - 1})
              else {
                setPos(null)
                resultsFocusRef.current = false
                searchRef.current.focus()
              }
          } else
            for(let key of Object.keys(resultsRef.current))
              if (resultsRef.current[key].length) {
                setPosKb({cat: key, i: 0})
                break
              }
          break
        case 83:
        case 40:
          if (posRef.current) {
            if (resultsRef.current[posRef.current.cat][posRef.current.i + 3])
              setPosKb({...posRef.current, i: posRef.current.i + 3})
            else if (resultsRef.current[posRef.current.cat][posRef.current.i + (3 - (posRef.current.i % 3))])
              setPosKb({...posRef.current, i: resultsRef.current[posRef.current.cat].length - 1})
            else if (resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) + 1]] && resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) + 1]].length)
              if (resultsRef.current[Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) + 1]][posRef.current.i - Math.floor(posRef.current.i / 3) * 3])
                setPosKb({cat: Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) + 1], i: posRef.current.i - Math.floor(posRef.current.i / 3) * 3})
              else
                setPosKb({cat: Object.keys(resultsRef.current)[Object.keys(resultsRef.current).indexOf(posRef.current.cat) + 1], i: 0})
          } else
            for(let key of Object.keys(resultsRef.current))
              if (resultsRef.current[key].length)
                setPosKb({cat: key, i: 0})
          break
        case 13:
        case 32:
          switch (posRef.current.cat) {
            case 'summoners': history.push(`/summoners/${resultsRef.current[posRef.current.cat][posRef.current.i].region}/${resultsRef.current[posRef.current.cat][posRef.current.i].summonerName}`)
          }
          console.log(resultsRef.current[posRef.current.cat][posRef.current.i])
          break
      }
    }
  }
  const navUp = e => {
    if (e.keyCode == 27 && focusRef.current && !inputFocusRef.current) {
      setPos(null)
      resultsFocusRef.current = false
      searchRef.current.focus()
    }
  }
  const keyDown = e => {
  }
  const keyUp = e => {
    let value = e.target.value
    if (value != lastValue.current) {
      lastValue.current = e.target.value
      clearTimeout(loadSummoners.current)
      if (value.length < 3) {
        return setResults({items: [], summoners: []})
      }
      updateResults({items: assets.items.filter(el => el.name.toLowerCase().includes(value.toLowerCase()) && el.inStore)})
      updateResults({summoners: []})
      loadSummoners.current = setTimeout(() => {
        let r = []
        Promise.all(rgs.map(rg => 
          fetch(`/api/v1/summoner/${rg}/${value.toLowerCase()}`)
            .then(res => res.json())
            .then(res => {
              if (res.status == 200)
                r.push({...res.d.summoner, region: rg})
            })
            .catch(e => {console.log(e)})
        )).then(() => {
          updateResults({summoners: r})
        })
      }, 500)
      console.log(assets.items.filter(el => el.name.toLowerCase().includes(e.target.value.toLowerCase()) && el.inStore))
    } 
    switch (e.keyCode) {
      case 40:
      case 13:
        if (Object.values(resultsRef.current).find(el => el.length)) {
          for(let key of Object.keys(resultsRef.current))
            if (resultsRef.current[key].length) {
              setPos({cat: key, i: 0})
              break
            }
          searchRef.current.blur()
          resultsFocusRef.current = true
        }
        break
      case 27:
        setPos(null)
        searchRef.current.blur()
        resultsFocusRef.current = false
        focusRef.current = false
        setFocus(false)
        break
    }
    //console.log(assets.items.filter(el => el.name.includes('Boots')))
  }
  const scroll = () => {
    if (posRef.current && resultsFocusRef.current) {
      let currentRef = refs.current[posRef.current.cat][posRef.current.i].current
      let searchResults = searchResultsRef.current
      if (currentRef) {
        if (currentRef.offsetTop < cssRh(11) + searchResults.scrollTop) {
          mouseLock.current = true
          Velocity(searchResults, 'finish')
          Velocity(searchResults, 'scroll', {
            offset: currentRef.offsetTop - cssRh(11) - searchResults.scrollTop,
            container: searchResults, duration: 150
          })
            .then(e => e[0].classList.contains('velocity-animating') ? null : mouseLock.current = false)
        } else if (currentRef.offsetTop > (searchResults.clientHeight - currentRef.clientHeight - cssRh(11)) + searchResults.scrollTop) {
          mouseLock.current = true
          Velocity(searchResults, 'finish')
          Velocity(searchResults, 'scroll', {
            offset: currentRef.offsetTop + currentRef.clientHeight + cssRh(11) - searchResults.clientHeight - searchResults.scrollTop,
            container: searchResults, duration: 150
          })
            .then(e => e[0].classList.contains('velocity-animating') ? null : mouseLock.current = false)
        }
      }
    }
  }
  useEffect(() => {
    document.addEventListener('click', update)
    document.addEventListener('keyup', e => {
      if (e.keyCode == 13 && !focusRef.current) {
        setFocus(true)
        searchRef.current.focus()
      }
    })
    window.addEventListener('resize', updateScroll.current)
    return () => {
      document.removeEventListener('click', update)
      window.removeEventListener('resize', updateScroll.current)
    }
  }, [])
  useEffect(() => {
    updateScroll.current()
    resultsRef.current = results
    posRef.current = pos
    pos && pos.scroll && scroll()
    /*
    if (posRef.current && resultsFocusRef.current) {
      if (refs.current[posRef.current.cat][posRef.current.i].current)
        if (refs.current[posRef.current.cat][posRef.current.i].current.offsetTop < document.documentElement.clientHeight / 100 * 11 + searchResultsRef.current.scrollTop) {
          mouseLock.current = true
          Velocity(searchResultsRef.current, 'finish')
          Velocity(searchResultsRef.current, 'scroll', {offset: refs.current[posRef.current.cat][posRef.current.i].current.offsetTop - document.documentElement.clientHeight / 100 * 11 - searchResultsRef.current.scrollTop, container: searchResultsRef.current, duration: 150})
            .then(e => e[0].classList.contains('velocity-animating') ? null : mouseLock.current = false)
        } else if (refs.current[posRef.current.cat][posRef.current.i].current.offsetTop > (searchResultsRef.current.clientHeight - refs.current[posRef.current.cat][posRef.current.i].current.clientHeight - document.documentElement.clientHeight / 100 * 8) + searchResultsRef.current.scrollTop) {
          mouseLock.current = true
          Velocity(searchResultsRef.current, 'finish')
          Velocity(searchResultsRef.current, 'scroll', {offset: refs.current[posRef.current.cat][posRef.current.i].current.offsetTop + refs.current[posRef.current.cat][posRef.current.i].current.clientHeight + document.documentElement.clientHeight / 100 * 8 - searchResultsRef.current.clientHeight - searchResultsRef.current.scrollTop, container: searchResultsRef.current, duration: 150})
            .then(e => e[0].classList.contains('velocity-animating') ? null : mouseLock.current = false)
        }
    }
    */
  }, [results, pos])
  useEffect(() => {
    focusRef.current = focus
    if (focus) {
      document.addEventListener('keydown', nav)
      document.addEventListener('keyup', navUp)
    } else {
      document.removeEventListener('keydown', nav)
      document.removeEventListener('keyup', navUp)
    }
    return () => {
      document.removeEventListener('keydown', nav)
      document.removeEventListener('keyup', navUp)
    }
  }, [focus])
  return (
    <div id="overlay-main" className={focus ? 'focus' : ''}>
      <div id="sitename">SITENAME</div>
      <div id="description">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore</div>
      <input id="search" type="text" placeholder="Champion | Summoner | Item ..." autoComplete="off" onClick={() => setFocus(true)} onKeyDown={keyDown} onKeyUp={keyUp} ref={searchRef} onFocus={() => inputFocusRef.current = true} onBlur={() => inputFocusRef.current = false} />
      <div id="search-results-wr">
        <DoubleScrollbar childRef={ref => searchResultsRef = ref} updateScroll={ref => updateScroll.current = ref}>
        <div id="search-results" onScroll={updateScroll.current}>
          <div className="search-results-summoners">
            {results.items.length > 0 &&
              <>
                <div className="headline">
                  <div className="title">Items</div>
                  <div className="count">[ {results.items.length} ]</div>
                </div>
                <div className="list-wr">
                  {results.items.map((el, i) =>
                    <div className={'list-el' + (pos ? (pos.cat == 'items' && pos.i == i ? ' focus' : '') : '')} key={i} onMouseEnter={() => !mouseLock.current && setPosMouse({cat: 'items', i: i})} onMouseLeave={() => !mouseLock.current && setPos(null)} ref={refs.current.items[i] = React.createRef()}>
                      <div className="el-icon"><img src={`http://ddragon.leagueoflegends.com/cdn/10.4.1/img/item/${el.id}.png`} /></div>
                      <div className="el">
                        <div className="item-name">{el.name}</div>
                        <div className="el-info">
                          <div className="item-from-wr">{el.from.map((el, i) => <img className="item-from" src={`http://ddragon.leagueoflegends.com/cdn/10.4.1/img/item/${el}.png`} key={i} />)}</div>
                        </div>
                      </div>
                      <div className="item-price">{el.priceTotal}</div>
                    </div>
                  )}
                </div>
              </>
            }
            {results.summoners &&
              <>
                <div className="headline">
                  <div className="title">Summoners</div>
                  <div className="count">[ {results.summoners ? (results.summoners.length ? results.summoners.length : 'Not found') : '...'} ]</div>
                </div>
                <div className="list-wr">
                  {results.summoners.map((el, i) =>
                    <Link to={`/summoners/${el.region}/${el.summonerName}`} className={'list-el' + (pos ? (pos.cat == 'summoners' && pos.i == i ? ' focus' : '') : '')} key={i} onMouseEnter={() => setPosMouse({cat: 'summoners', i: i})} onMouseLeave={() => setPos(null)} ref={refs.current.summoners[i] = React.createRef()}>
                      <div className="el-icon"><img src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${el.profileIconId}.jpg`} /></div>
                      <div className="el">
                        <div className="profile-name">{el.summonerName}</div>
                        <div className="el-info">
                          <div className="profile-rank">{el.rank}</div>
                          <div className="profile-level">{el.summonerLevel} level</div>
                        </div>
                      </div>
                      <div className="profile-region">{el.region.toUpperCase()}</div>
                    </Link>
                  )}
                </div>
              </>
            }
          </div>
        </div>
        </DoubleScrollbar>
      </div>
    </div>
  )
}