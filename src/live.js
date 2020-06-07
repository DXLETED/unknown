import React, { Fragment, useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { DraggableCore } from 'react-draggable'
import { colors } from './colorlist'
import Settings from './settings'
import { useParams, useLocation, Route } from 'react-router'
import classnames  from 'classnames'
import { cssRh } from './components/cssvars'
import { rankColor } from './constants/colorRanks'
import { shortTiers } from './constants/shortTiers'
import { Loading } from './components/loading'
import assets from './assets'
import { fetchError } from './fetcherror'

const Player = (props) => {
  let id = 'player-' + props.id
  let img = `/static/img/champion-splashes/${props.data.championId}.jpg`
  let settings = useSelector(state => state.settings)
  let [position, setPosition] = useState(0)
  let [visible, setVisible] = useState(false)
  let [fullyVisible, setFullyVisible] = useState(false)
  let startPosition = useRef()
  let mouseDown = useRef()
  let ref = useRef()
  let backdrop = useRef()
  let getQueueType = {
    420: 'RANKED_SOLO_5x5',
    440: 'RANKED_FLEX_SR'
  }
  let mainLeague = props.data.leagues && 
    props.data.leagues.find(el => el.queueType = getQueueType[420])
      ? props.data.leagues.find(el => el.queueType = getQueueType[420])
      : {tier: 'UNRANKED', rank: 'I', percentage: 0, wins: 0, losses: 0}
  mainLeague.percentage = Math.round(mainLeague.wins / (mainLeague.wins + mainLeague.losses) * 100)
  const getLeagueColor = perc => 
    perc < 45 ? colors.red :
    perc <= 47 ? colors.orange :
    perc <= 52 ? colors.yellow :
    perc <= 55 ? colors.green :
    perc > 55 ? colors.blue : null
  const romanToInt = input =>
    input == 'I' ? 1 :
    input == 'II' ? 2 :
    input == 'III' ? 3 :
    input == 'IV' ? 4 : null
  const hiddenRanks = ['UNRANKED', 'MASTER', 'GRANDMASTER', 'CHALLENER']
  const mouseMove = e => {
    if (mouseDown.current) {
      setPosition(e.clientY - startPosition.current)
      Array.from(ref.current.closest('.team').children).map(el => el.classList.remove('backdrop'))
      console.log(Array.from(ref.current.closest('.team').children).map(el => el.offsetTop), ref.current.offsetTop, ref.current.children[0].offsetTop)
      backdrop.current = Array.from(ref.current.closest('.team').children).find(el =>
        el.offsetTop - cssRh(12) < ref.current.offsetTop + ref.current.children[0].offsetTop + (e.clientY - startPosition.current) &&
        ref.current.offsetTop + ref.current.children[0].clientHeight + ref.current.children[0].offsetTop + (e.clientY - startPosition.current) < el.offsetTop + el.clientHeight + cssRh(12))
      backdrop.current && backdrop.current != ref.current &&
        backdrop.current.classList.add('backdrop')
    }
  }
  const mouseUp = e => {
    if (mouseDown.current) {
      Array.from(ref.current.closest('.team').children).map(el => el.classList.remove('backdrop'))
      mouseDown.current = false
      setPosition(0)
      let refId = Array.from(ref.current.closest('.team').children).findIndex(el => el == ref.current)
      let backdropId = Array.from(ref.current.closest('.team').children).findIndex(el => el == backdrop.current)
      console.log(refId, backdropId)
      if (refId >= 0 && backdropId >= 0)
        props.swap(props.teamId, refId, backdropId)
    }
  }
  useEffect(() => {
    document.addEventListener('mousemove', mouseMove)
    document.addEventListener('mouseup', mouseUp)
    setTimeout(() => setVisible(true), props.id * 100)
    setTimeout(() => setFullyVisible(true), 1000)
  }, [])
  mainLeague.color = getLeagueColor(mainLeague.percentage)
  let background = props.teamId == 1
    ? `linear-gradient(to right, transparent calc(100% - (var(--vh) * var(--sc) * 40)), ${colors.lmain} calc(100% - (var(--vh) * var(--sc) * 15))), url(${img}) calc(var(--vh) * var(--sc) * -10) calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 50) no-repeat`
    : `linear-gradient(to left, transparent calc(100% - (var(--vh) * var(--sc) * 40)), ${colors.lmain} calc(100% - (var(--vh) * var(--sc) * 15))), url(${img}) calc(var(--vh) * var(--sc) * 10) calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 50) no-repeat`
  return (
    <div className={classnames('player-wr', {hide: !visible, fullyVisible})}
      onMouseDown={e => {
        startPosition.current = e.clientY
        mouseDown.current = true
      }}
      style={fullyVisible ? {transform: `translateY(${position}px`, opacity: mouseDown.current ? 0.7 : 1} : {}}
      ref={ref}>
      <div id={id} className={classnames('player', {user: props.data.user})}>
        <div className="main">
          <div className="spells"></div>
          <div className="info">
            <div className="summoner_name"><span>{props.data.summonerName}</span></div>
            <div className={classnames('rank', {full: settings.full_leagues})}>
              <div className="ranklp" style={{color: settings.colored_ranks ? rankColor[mainLeague.tier] : ''}}>{settings.full_leagues ? mainLeague.tier[0] + mainLeague.tier.slice(1).toLowerCase() + ' ' : shortTiers[mainLeague.tier]}{hiddenRanks.find(tier => tier === mainLeague.tier) ? '' : romanToInt(mainLeague.rank)}<div className="lp">{'leaguePoints' in mainLeague && `${mainLeague.leaguePoints}LP`}</div></div>
              <img className="position" src={mainLeague.tier != 'UNRANKED' ? `/static/img/positions/${mainLeague.tier}-${props.pos}.png` : `/static/img/positions/iron-${props.pos}.png`}/>
            </div>
            <div className="winrate">
              <div className="status"><div className="wins" style={{width: `${mainLeague.percentage}%`, background: mainLeague.color}}></div></div>
              <div className="text">
                <div className="wins">{mainLeague.wins}W</div>
                <div className="percentage">{mainLeague.wins + mainLeague.losses ? mainLeague.percentage + '%' : ''}</div>
                <div className="loses">{mainLeague.losses}L</div>
              </div>
            </div>
            <div className="stats">
              <div className="champ-winrate">50%<div className="matches">/0 matches</div></div>
              <div className="k/d/a">0.0/0.0/0.0</div>
            </div>
            <div className="activity"></div>
          </div>
          <div className="img" style={{background: background}}></div>
          <img src="/static/img/champion-splashes/498.jpg" />
        </div>
        <div className="tags">
          <div className="tag"><img src="/static/img/arrow/white_up.png" />Tag1</div>
          <div className="tag"><img src="/static/img/arrow/white_down.png" />Tag2</div>
        </div>
      </div>
    </div>
  )
}

const LiveMatch = () => {
  let { rg, summonerName } = useParams()
  let location = useLocation()
  let [matchInfo, setMatchInfo] = useState({})
  let [summoners, setSummoners] = useState({1: [], 2: []})
  let [results, setResults] = useState({})
  const [visibility, setVisibility] = useState({teamDamageType: false, skillOrder: false, items: false})
  let visibilityRef = useRef()
  let ws = useRef()
  let [positions, setPositions] = useState({team1: ['top', 'jng', 'mid', 'bot', 'sup'], team2: ['top', 'jng', 'mid', 'bot', 'sup']})
  let [user, setUser] = useState()
  const [error, setError] = useState()
  const positionsOrder = ['top', 'jng', 'mid', 'bot', 'sup']
  useEffect(() => {
    ws.current = new WebSocket(`ws://${window.location.host}/ws/live/${rg}/${summonerName}`)
    ws.current.onmessage = res => {
      let data = JSON.parse(res.data)
      console.log(data)
      if (data.status === 200) {
        if (data.loadstatus.ended) {
          useResults(data.d.results)
        } else if (data.loadstatus.match) {
          ;[...data.d.teams.team1, ...data.d.teams.team2].map((el, i) => data.d.teams['team' + el.teamId / 100][el.id] = {...el, user: el.summonerName == summonerName})
          let userId = ([...data.d.teams.team1, ...data.d.teams.team2].findIndex(el => el.summonerName.toLowerCase() == summonerName.toLowerCase()))
          if (userId >= 5)
            data.d.teams = {team2: data.d.teams.team1, team1: data.d.teams.team2}
          setMatchInfo(data)
          setUser({...[...data.d.teams.team1, ...data.d.teams.team2].find(el => el.summonerName.toLowerCase() == summonerName.toLowerCase()), userId})
        }
      } else {
        setError(data)
      }
    }
    setTimeout(() => setVisibility({...visibilityRef.current, teamDamageType: true}), 200)
    setTimeout(() => setVisibility({...visibilityRef.current, skillOrder: true}), 400)
    setTimeout(() => setVisibility({...visibilityRef.current, items: true}), 600)
    return () => ws.current && ws.current.close()
  }, [location])
  useEffect(() => {
    visibilityRef.current = visibility
  }, [visibility])
  const swap = (teamId, a, b) => {
    let teamPositions = positions['team' + teamId]
    teamPositions[a] = [teamPositions[b], teamPositions[b] = teamPositions[a]][0]
    setPositions({...positions, ['team' + teamId]: teamPositions})
  }
  console.log(visibility)
  return (
      matchInfo.loadstatus && matchInfo.loadstatus.match ?
        <main>
          {matchInfo.loadstatus && matchInfo.loadstatus.match &&
            <>
              <div id="team1" className="team">
                {positions.team1.map((pos, i) =>
                  <Player id={i} teamId={1} data={matchInfo.d.teams.team1.find(summ => summ.position == pos)} pos={positionsOrder[i]} key={i} swap={swap} />
                )}
              </div>
              <div id="team2" className="team">
                {positions.team2.map((pos, i) =>
                  <Player id={i} teamId={2} data={matchInfo.d.teams.team2.find(summ => summ.position == pos)} pos={positionsOrder[i]} key={i} swap={swap} />
                )}
              </div>
            </>
          }
          <div id="cheatsheet">
            <div id="teams-damagetype" className={classnames('widget', {hide: !visibility.teamDamageType})}>
              <div className="head">
                <div className="title">Team damage type</div>
                <div className="visibility">HIDE</div>
              </div>
              <div className="body">
                <div className="team1">
                  <div className="caption">Your team</div>
                  <div className="status">
                    <div className="ad"></div>
                    <div className="ap"></div>
                  </div>
                  <div className="percentage">
                    <div className="ad">AD 50%</div>
                    <div className="ap">50% AP</div>
                  </div>
                </div>
                <div className="team2">
                  <div className="caption">Enemy team</div>
                  <div className="status">
                    <div className="ad"></div>
                    <div className="ap"></div>
                  </div>
                  <div className="percentage">
                    <div className="ad">AD 50%</div>
                    <div className="ap">50% AP</div>
                  </div>
                </div>
              </div>
            </div>
            <div id="skill-order" className={classnames('widget', {hide: !visibility.skillOrder})}>
              <div className="head">
                <div className="title">Skill order</div>
                <div className="visibility">HIDE</div>
              </div>
              <div className="body">
                {user && (() => {
                  if (!(user.championId in assets.championStats)) {
                    return 'Champion stats not found'
                  }
                  let [orderKey, orderStats] = Object.entries(assets.championStats[user.championId].skillOrders)[0]
                  let order = JSON.parse(orderKey)
                  let spells = Object.values(assets.champions).find(champ => champ.key == user.championId).spells
                  return (
                    order && spells && <>
                      <div className="abilities">
                        <div className="ability Q"><img src={`/static/img/spell/${spells[0].image.full}`} />{[...Array(15)].map((el, i) => <div className={classnames({use: order[i] === 1})}>{order[i] === 1 && 'Q'}</div>)}</div>
                        <div className="ability W"><img src={`/static/img/spell/${spells[1].image.full}`} />{[...Array(15)].map((el, i) => <div className={classnames({use: order[i] === 2})}>{order[i] === 2 && 'W'}</div>)}</div>
                        <div className="ability E"><img src={`/static/img/spell/${spells[2].image.full}`} />{[...Array(15)].map((el, i) => <div className={classnames({use: order[i] === 3})}>{order[i] === 3 && 'E'}</div>)}</div>
                        <div className="ability R"><img src={`/static/img/spell/${spells[3].image.full}`} />{[...Array(15)].map((el, i) => <div className={classnames({use: order[i] === 4})}>{order[i] === 4 && 'R'}</div>)}</div>
                      </div>
                      <div className="skill-order-stats">
                        <div className="pickrate"><img src="/static/img/done.png" />{parseFloat((orderStats.pickrate * 100).toFixed(2))}%</div>
                        <div className="winrate"><img src="/static/img/star-wh.png" />{parseFloat((orderStats.winrate * 100).toFixed(2))}%</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
            <div id="items" className={classnames('widget', {hide: !visibility.items})}>
              <div className="head">
                <div className="title">Items</div>
                <div className="visibility">HIDE</div>
              </div>
              <div className="body">
                {user && assets.championStats[user.championId] && (() => {
                  let builds = Object.keys(assets.championStats[user.championId].items.builds)
                  return builds.slice(0, 3).map(buildStr => {
                    let build = JSON.parse(buildStr)
                    return (
                      <div className="itembuild">
                        <img className="item" src={`/static/img/items/${build[0]}.png`} />
                        <img className="arrow" src="/static/img/arrow/white_right.png" />
                        <img className="item" src={`/static/img/items/${build[1]}.png`} />
                        <img className="arrow" src="/static/img/arrow/white_right.png" />
                        <img className="item" src={`/static/img/items/${build[2]}.png`} />
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        </main>
      : <div className="status">{error ? fetchError(error) : <>Loading match<Loading /></>}</div>
  )
}

const LiveMatchList = () => {
  const [matchList, setMatchList] = useState()
  const [error, setError] = useState()
  useEffect(() => {
    fetch('/api/v1/liveMatches')
      .then(res => res.json())
      .then(res => {
        return setMatchList([])
        if (res.status === 200) {
          setMatchList(res.d)
        }
      })
  }, [])
  return matchList ?
      matchList.length ?
      <div></div>
      : <div className="status">No tracked matches</div>
    : <div className="status">{error ? fetchError(error) : <>Loading match<Loading /></>}</div>
}

export const Live = () => {
  return (
    <>
      <div id="live" className="page">
        <Route exact path="/live" component={LiveMatchList} />
        <Route path="/live/:rg/:summonerName" component={LiveMatch} />
      </div>
    </>
  )
}