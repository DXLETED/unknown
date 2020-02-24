import React, { Fragment, useEffect, useState, useRef, useContext, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useCallbackRef } from 'use-callback-ref'
import { randomBytes } from 'crypto'
import { throws } from 'assert'
import { NavLink as Link, useHistory, useLocation } from 'react-router-dom'
import Menu from './components/menu'
import { Switch, SwitchMenu } from './components/switch'
import { useSelector, useDispatch } from 'react-redux'

const Select = (props) => {
  let ref = useRef()
  let id = 'select-' + props.id
  const [selected, setSelected] = useState(0)
  const [open, setOpen] = useState(false)
  const [top, setTop] = useState(false)
  const updatePosition = () => {
    let dropdown = ref.current.getElementsByClassName('dropdown')[0]
    if (document.body.clientHeight - dropdown.offsetTop - dropdown.clientHeight < document.body.clientHeight * 0.05) {
      setTop(true)
    } else {
      setTop(false)
    }
  }
  const update = (e) => {
    if (e.target.closest('.select')) {
      if (e.target.closest('.select') != ref.current) {
        setOpen(false)
      }
    } else {
      setOpen(false)
    }
  }
  useEffect(() => {
    document.addEventListener('click', (e) => update(e))
    window.addEventListener('resize', updatePosition())
  }, [])
  useEffect(() => {
    updatePosition()
  })
  const addActiveClass = (e) => {
    setOpen(true)
    let dropdown = ref.current.getElementsByClassName('dropdown')[0]
    console.log(document.body.clientHeight - dropdown.offsetTop - dropdown.clientHeight)
    e.stopPropagation()
  }
  const setValue = (e, value) => {
    setSelected(value)
    setOpen(false)
    e.stopPropagation()
  }
  return (
    <div id={id} className={(props.className ? props.className + ' ' : '') + 'select' + (props.color ? ' select-' + props.color : '') + (open ? ' active' : '') + (top ? ' top' : '')} ref={ref}>
      <div className="selected" onClick={(e) => addActiveClass(e)}>{props.dropdown[selected]}</div>
      <div className="dropdown">{props.dropdown.map((el, i) => <div key={i} className={'selectitem' + (selected == i ? ' active' : '')} onClick={e => setValue(e, i)}>{el}</div>)}</div>
    </div>
  )
}

class Button extends React.Component {
  render() {
    return (
      <div className={this.props.className + ' button'}></div>
    )
  }
}

import history from './history'
import fetch from 'node-fetch'
function ActionLink() {
  function handleClick(e) {
    //e.preventDefault()
    console.log('По ссылке кликнули.')
    //history.push('/champions/')
  }
  return (
    <a href="#" onClick={handleClick}>
      ???
    </a>
  )
}

function useLocation1() {
  let hkk = useSelector(state => state.location)
  return hkk
}

const Limits = () => {
  let [limits, setLimits] = useState()
  let limRef = useRef()
  let ws = useRef()
  let lastTime = useRef()
  let rg = 'ru'
  const menu = useSelector(state => state.menus.devtools)
  const switchmenu = useSelector(state => state.switchmenu.limits)
  let limitsUpdate
  useEffect(() => {
    if (menu && switchmenu) {
      fetch('/api/v1/limits/')
        .then(response => response.json())
        .then(response => {
          setLimits(response)
        })
      ws.current = new WebSocket(`ws://${window.location.host}/ws/limits/`)
      ws.current.onopen = e => {
        lastTime.current = Date.now()
        limitsUpdate = setInterval(() => {
          setLimits({...limRef.current, time: limRef.current.time + (Date.now() - lastTime.current)})
          lastTime.current = Date.now()
        }, 100)
      }
      ws.current.onmessage = function(event) {
        setLimits(JSON.parse(event.data))
      }
    } else {
      if (ws.current) {
        try {
          ws.current.close()
        } catch(e) {}
        ws.current = undefined
      }
      clearInterval(limitsUpdate)
    }
    return () => clearInterval(limitsUpdate)
  }, [menu, switchmenu])
  useEffect(() => {
    limRef.current = limits
  }, [limits])
  if (limits) {
    let methods = limits.regions[rg]
    let r = []
    for (let mtd in methods) {
      let awaiting = limits.regions[rg][mtd]['drop'] > limits.time
      r.push(
        <div className="mtd-wr" key={mtd}>
          <div className="mtd-name">{mtd}</div>
          <div className="count-wr">
            <div className={'count' + (limits.regions[rg][mtd]['count'] == 0 ? ' ended' : '')}>{awaiting ? limits.regions[rg][mtd]['count'] : limits.regions[rg][mtd]['limit']}<div className="limit">/{limits.regions[rg][mtd]['limit']}</div></div>
            <div className={'drop' + (awaiting ? ' awaiting' : '')}>{awaiting ? (<><img src="/static/img/refresh.png" />{((limits.regions[rg][mtd]['drop'] - limits.time) / 1000).toFixed(1)}s</>) : (<img src="/static/img/done.png" />)}</div>
          </div>
        </div>
      )
    }
    return <div className="limits">{r}</div>
  } else {
    return <div className="limits"><div className="limits-loading">Loading...</div></div>
  }
}

const RiotApiKey = () => {
  let [key, setKey] = useState(false)
  useEffect(() => {
    fetch('/api/v1/key')
      .then(res => res.json())
      .then(res => setKey(res))
  }, [])
  if (key) return (
    key.key
  )
  else return <div>???</div>
}

const Header = () => {
  let settings = useSelector(state => state.settings)
  const dispatch = useDispatch()
  let location = useLocation()
  let location1 = useLocation1('/live/:id/')
  useEffect(() => {
    console.log(location.pathname, window.location.pathname.split('/'))
  }, [location])
  useEffect(() => {
    console.log(22, location1)
  }, [location1])
  useEffect(() => {
    console.log('Header', settings)
    return () => {
      // componentWillUnmount
    }
  })
  return (
    <header>
      <div id="header">
        <div id="l-header">
          <Link id="logo" to="/"><div id="logo-text">?????.net</div></Link>
          <div id="search">
            <input type="text" />
          </div>
          <div id="filter">ALL</div>
          <div className="l-list">
            <Link className="list-el link" to="/champions/" children="Champions" />
            <Link className="list-el link" to="/statistics/" children="Statistics" />
            <Link className="list-el link" to="/live/" children="Live" />
            <Link className="list-el disabled link" to="/tft/" children="TFT" />
          </div>
        </div>
        <div id="r-header">
          <div className="r-list">
            <Menu
              className="list-el"
              id="devtools"
              label={<><span>&lt;&gt; DevTools &lt;/&gt;</span></>}
              dropdown={
                <>
                  <SwitchMenu akey="riotapi-key" id="riotapi-key" headline={<><div className="label">RiotAPI key</div></>}>
                    <RiotApiKey />
                  </SwitchMenu>
                  <SwitchMenu akey="limits" id="limits" headline={<><div className="label">RiotAPI rate limits</div><div className="props">Region: <Select id="limits-region" selected="RU" color="wh" dropdown={['NA', 'RU']} /></div></>}>
                    <Limits />
                  </SwitchMenu>
                  123
                </>
              } overlay={
                123
              }/>
            <Menu className="list-el disabled" id="themes" label={<><img src="/static/img/header/personalization_white.png" /><span>Themes</span></>} dropdown={
              321
            } disabled />
            <Menu className="list-el" id="settings" label={<><img src="/static/img/header/settings_white.png" /><span>Settings</span></>} dropdown={
              <Switch akey="colored_ranks" label="Colored ranks" />
            } />
            <Select className="list-el" id="lang" selected="English" color="wh" dropdown={
              ['English', 'Russian']
            } />
            {/*
            <Select className="list-el" id="search" selected={<img src="/static/img/header/search_white.png" />} dropdown={
              <div>321</div>
            } />
            <Select className="list-el" id="menu" selected={<img src="/static/img/header/menu_white.png" />} dropdown={
              <div>321</div>
            } />
            */}
          </div>
        </div>
      </div>
    </header>
  )
}

export { Header, Select }