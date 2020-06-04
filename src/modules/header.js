import React, { Fragment, useEffect, useState, useRef, useContext, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useCallbackRef } from 'use-callback-ref'
import { randomBytes } from 'crypto'
import { throws } from 'assert'
import { NavLink as Link, useHistory, useLocation } from 'react-router-dom'
import Menu from '../components/menu'
import { Switch, SwitchMenu } from '../components/switch'
import { useSelector, useDispatch } from 'react-redux'
import { ConfInput } from '../components/input'
import { Select } from '../components/select'
import regions from '../constants/regions'

function useLocation1() {
  let hkk = useSelector(state => state.location)
  return hkk
}

const Limits = () => {
  const settings = useSelector(state => state.settings)
  const rg = Object.values(regions)[settings.limitsRegion]
  let [limits, setLimits] = useState()
  let limRef = useRef()
  let ws = useRef()
  let lastTime = useRef()
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
    console.log(Object.keys(regions)[settings.limitsRegion])
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
  let updateValue = useRef()
  let getValue = useRef()
  useEffect(() => {
    fetch('/api/v1/key', {headers: {'Authorization': 'Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbiI6ImFkbWluIiwiaWQiOiI1ZTczYTg4NmI5Y2VkZDRlYzg0ODRlODYiLCJleHAiOjE1OTU5NDI3OTEsImlhdCI6MTU5MDc1ODc5MX0.zjQXpq1Q7PlNxuYuX9kIvTGFlYWportb5rXxI_uKiWs'}})
      .then(res => res.json())
      .then(res => updateValue.current(res.key))
  }, [])
  return (
    <ConfInput confirm={() => fetch('/api/v1/key', {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbiI6ImFkbWluIiwiaWQiOiI1ZTczYTg4NmI5Y2VkZDRlYzg0ODRlODYiLCJleHAiOjE1OTU5NDI3OTEsImlhdCI6MTU5MDc1ODc5MX0.zjQXpq1Q7PlNxuYuX9kIvTGFlYWportb5rXxI_uKiWs'}, body: JSON.stringify({key: getValue.current()})})} getValue={func => getValue.current = func} updateValue={func => updateValue.current = func} />
  )
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
            <Link className="list-el link" to="/summoners/" children="Summoners" />
            <Link className="list-el link" to="/statistics/" children="Statistics" />
            <Link className="list-el link" to="/live/ru/qwer" children="Live" />
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
                  <SwitchMenu akey="limits" id="limits" headline={<><div className="label">RiotAPI rate limits</div><div className="props">Region: <Select id="limits-region" akey="limitsRegion" selected={0} color="wh" dropdown={Object.keys(regions).map(rg => rg.toLocaleUpperCase())} /></div></>}>
                    <Limits />
                  </SwitchMenu>
                </>
              } overlay={
                123
              }/>
            <Menu className="list-el" id="settings" label={<><img src="/static/img/header/settings_white.png" /><span>Settings</span></>} dropdown={
              <>
                <Switch akey="colored_ranks" label="Colored ranks" />
                <Switch akey="full_leagues" label="Full leagues" />
              </>
            } />
            <Menu className="list-el" id="lang" label={<><img src="/static/img/header/language.png" /><span>EN</span></>} color="wh" dropdown="" />
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