import React, { Fragment, useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { DraggableCore } from 'react-draggable'
import { colors } from '../colorlist'
import Settings from '../settings'
import { useParams, useLocation, useRouteMatch } from 'react-router'
import classnames  from 'classnames'
import { cssRh } from '../components/cssvars'
import { fetchError } from '../fetcherror'
import { intLeague, intRank, strTier } from '../utils/intLeague'
import { rankColor } from '../constants/colorRanks'
import { timeSince } from '../utils/timeSince'
import moment from 'moment'
import { DoubleScrollbar } from '../components/double-scrollbar'
import { positions } from '../constants/positions'
import { queues } from '../constants/queues'
import assets from '../assets'
import { NavLink as Link } from 'react-router-dom'
import { Loading } from '../components/loading'

const Matches = props => {
  return (
    <>
      {props.matches.map((m, i) => {
        let user = m.match.participants.find(p => p.participantId === m.match.participantIdentities.find(p2 => p2.player.summonerId === props.summonerId).participantId)
        let img = `/static/img/champion-splashes/${user.championId}.jpg`
        let background = `linear-gradient(to right, transparent calc(100% - (var(--vh) * var(--sc) * 40)), ${colors.lmain} calc(100% - (var(--vh) * var(--sc) * 15))), url(${img}) calc(var(--vh) * var(--sc) * -10) calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 50) no-repeat`
        console.log(user.stats.perkSubStyle)
        return <div className={classnames('match', {win: user.stats.win, fail: !user.stats.win})} key={i}>
          <div className="matchInfo">
            <div className="img" style={{background}}></div>
            <div className="position"><img src={`/static/img/positions/${user.position}.png`} /></div>
            <div className="abilities">
              <div className="runes">
                <img className="mainRune" src={`/static/img/${(() => {
                  let mainPerkStyle = assets.runes.find(perkStyle => perkStyle.id === user.stats.perkPrimaryStyle)
                  let slot = mainPerkStyle.slots.find(slot => slot.runes.find(rune => rune.id === user.stats.perk0))
                  return slot.runes.find(rune => rune.id === user.stats.perk0).icon
                })()}`} />
                <img className="addRune" src={`/static/img/${assets.runes.find(perkStyle => perkStyle.id === user.stats.perkSubStyle).icon}`} />
              </div>
              <div className="spell1"><img src={`/static/img/summoner-spells/${user.spell1Id}.png`} /></div>
              <div className="spell2"><img src={`/static/img/summoner-spells/${user.spell2Id}.png`} /></div>
            </div>
            <div className="stats">
              <div className="stats1">
                <div className="k-d-a">{user.stats.kills} / {user.stats.deaths} / {user.stats.assists} <div className="kda">[ {parseFloat(((user.stats.kills + user.stats.assists) / user.stats.deaths).toFixed(2))} ]</div></div>
              </div>
              <div className="stats2">
                <div className="cs"><img src="/static/img/cs.png" />{user.stats.totalMinionsKilled}</div>
                <div className="wards"><img src="/static/img/ward.png" />{user.stats.wardsPlaced}</div>
              </div>
              <div className="items">
                {Array.from(new Array(6), (_, i) => i).map((a, i) =>
                  <img className={'item' + i} src={user.stats['item' + i] ? `http://ddragon.leagueoflegends.com/cdn/10.4.1/img/item/${user.stats['item' + i]}.png` : '/static/img/items/0.png'} />
                )}
                <div className="s"></div>
                <img className="ward" src={`http://ddragon.leagueoflegends.com/cdn/10.4.1/img/item/${user.stats.item6}.png`} />
              </div>
            </div>
            <div className="players">
              <div className="team1">
                {positions.map(pos => {
                  let pl = m.match.participants.filter(p => p.teamId === user.teamId).find(p => p.position === pos)
                  return (
                    <div>
                      <span className="summonerName">{m.match.participantIdentities.find(p => p.participantId === pl.participantId).player.summonerName}</span>
                      <div className="icon"><img src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${pl.championId}.png`} /></div>
                    </div>
                  )
                })}
              </div>
              <div className="positions">
                {positions.map(pos => <div><img src={`/static/img/positions/${pos}.png`} /></div>
                )}
              </div>
              <div className="team2">
                {positions.map(pos => {
                  let pl = m.match.participants.filter(p => p.teamId !== user.teamId).find(p => p.position === pos)
                  if (!pl) console.log(m.match)
                  return (
                    <div>
                      <div className="icon"><img src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${pl.championId}.png`} /></div>
                      <span className="summonerName">{m.match.participantIdentities.find(p => p.participantId === pl.participantId).player.summonerName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="head">
            <div className={classnames('winlose', user.stats.win ? 'win' : 'lose')}>{user.stats.win ? 'WIN' : 'LOSE'}</div>
            <div className="gametype">{queues(m.match.queueId)}</div>
            <div className="gameduration">{~~(m.match.gameDuration / 60)} minutes</div>
            <div className="gamecreation">{Date.now() - m.match.gameCreation <= 604800000 ? moment(m.match.gameCreation).fromNow() : moment(m.match.gameCreation).format('YYYY-MM-DD')}</div>
            <div className="gameversion">v{m.match.gameVersion.split('.')[0]}.{m.match.gameVersion.split('.')[1]}</div>
          </div>
        </div>
      })}
    </>
  )
}

const Summoners = () => {
  let { rg, summonerName } = useParams()
  const [summoner, setSummoner] = useState()
  const [leagues, setLeagues] = useState()
  const [matches, setMatches] = useState()
  const [mainPos, setMainPos] = useState()
  const [nowplaying, setNowPlaying] = useState()
  let mainRef = useRef()
  let matchesRef = useRef()
  let ws = useRef()
  let updateScroll = useRef()
  let maxIntLeague
  let minIntLeague
  let leagueGraph
  let lastGraphChunk = []
  let curDay = new Date().getDay()
  let match = useRouteMatch()
  useEffect(() => {
    ws.current = new WebSocket(`ws://${window.location.host}/ws/summonerProfile/${rg}/${summonerName}`)
    ws.current.onmessage = res => {
      let data = JSON.parse(res.data)
      console.log(data)
      if (data.status === 200) {
        data.loadstatus.summoner && setSummoner(data.d.summoner)
        data.loadstatus.leagues && setLeagues(data.d.leagues)
        data.loadstatus.matchlist && setMainPos(data.d.mainPosition)
        data.loadstatus.matches && setMatches(data.d.matches)
        data.loadstatus.nowplaying && setNowPlaying(data.d.nowplaying)
      } else {
        console.log(data.status)
      }
    }
    return () => ws.current && ws.current.close()
  }, [location])
  let mainLeague = leagues
    ? leagues.find(el => el.queueType == 'RANKED_SOLO_5x5')
      ? leagues.find(el => el.queueType == 'RANKED_SOLO_5x5')
      : {tier: 'UNRANKED', rank: 'I', percentage: 0, wins: 0, losses: 0}
    : null
  if (summoner && leagues) {
    maxIntLeague = Math.max.apply(null, Object.values(leagues).map(el => intLeague(el.tier, el.rank, el.leaguePoints)))
    minIntLeague = Math.min.apply(null, Object.values(leagues).map(el => intLeague(el.tier, el.rank, el.leaguePoints)))
    leagueGraph = Array.apply(null, {length: 28}).map((el, i) => i - 27).map((day, i) => {
      let d = new Date(Date.now() + day*24*60*60*1000)
      let current = leagues[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`]
      if (!current) {
        return {pos: [0, 0], days: 0}
      }
      let ld = new Date(Date.now() + (day-1)*24*60*60*1000)
      let last = lastGraphChunk[0]
      let lastDay = lastGraphChunk[1]
      lastGraphChunk = [current, i]
      if (!last) {
        return {pos: [0, 0], days: 0}
      }
      const uniq = arr => {
        for(var c = 0, r = {}; c < arr.length; c ++) {
          if (!(arr[c] in r)) r[arr[c]] = 1
          else r[arr[c]] ++
        }
        return r
       }
      //let poss = uniq(Array.apply(null, {length: Math.abs(intLeague(last.tier, last.rank, last.leaguePoints) - intLeague(current.tier, current.rank, current.leaguePoints))}).map((el, i) => i + Math.min(intLeague(last.tier, last.rank, last.leaguePoints), intLeague(current.tier, current.rank, current.leaguePoints))).map(el => strTier(el)))
      let bgs = current.tier == strTier(minIntLeague) ? {[current.tier]: Math.abs(minIntLeague - intLeague(current.tier, current.rank, current.leaguePoints))} : uniq(Array.apply(null, {length: Math.abs(minIntLeague - intLeague(current.tier, current.rank, current.leaguePoints))}).map((el, i) => i + minIntLeague).map(el => strTier(el)))
      console.log(bgs)
      //return {pos: [intLeague(last.tier, last.rank, last.leaguePoints), intLeague(current.tier, current.rank, current.leaguePoints)], colors: last.tier == current.tier ? rankColor[current.tier] : [rankColor[last.tier], rankColor[current.tier]]}
      return {pos: [intLeague(last.tier, last.rank, last.leaguePoints) - minIntLeague, intLeague(current.tier, current.rank, current.leaguePoints) - minIntLeague], days: i - lastDay, bgs: Object.keys(bgs).length > 1 ? `linear-gradient(to top, ${Object.keys(bgs).map(el => `${rankColor[el]}, ${rankColor[el]} ${bgs[el] / (maxIntLeague - minIntLeague) * 100}%`)})` : rankColor[Object.keys(bgs)[0]]}
    })
    console.log(leagueGraph)
  }
  return (
    <div id="summoners" className="page" ref={mainRef}>
      <main>
        {summoner &&
          <>
            <div id="side">
              <div id="summoner">
                <img id="profile-icon" src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summoner.profileIconId}.jpg`} />
                <div id="summoner-data">
                  <div id="summoner-name">{summoner.summonerName}</div>
                  <div id="summoner-info">
                    <div id="summoner-level"><div className="title">Level</div><div className="value">{summoner.summonerLevel}</div></div>
                    <div id="summoner-mainpos"><div className="title">Main position</div><div className="value">{mainPos ? mainPos[0].toUpperCase() + mainPos.slice(1) : 'Loading'}</div></div>
                  </div>
                </div>
              </div>
              <div id="league">
                {mainLeague ? (
                  <>
                    <div id="league-tier">
                      <div id="tier">{mainLeague.tier[0] + mainLeague.tier.slice(1).toLowerCase()}</div>
                      <div id="rank">{mainLeague.rank}</div>
                    </div>
                    <div id="league-graph">
                      {/*leagueGraph && leagueGraph.map((el, i) => (
                        <svg className="graph-chunk" viewBox={`0 0 100 ${(maxIntLeague - minIntLeague) * 1.2}`} preserveAspectRatio="none">
                          {console.log(el)}
                          {Array.isArray(el.colors) && <linearGradient id={`gradient${i}`} x2="100%" y2="0%">
                            <stop offset="0%" stopColor={el.colors[0]} />
                            <stop offset="100%" stopColor={el.colors[1]} />
                          </linearGradient>}
                          <polygon points={`0,${(maxIntLeague - minIntLeague) * 1.2} 0,${maxIntLeague - el.pos[0]} 100,${maxIntLeague - el.pos[1]} 100,${(maxIntLeague - minIntLeague) * 1.2}`} fill={Array.isArray(el.colors) ? `url(#gradient${i})` : el.colors} fillOpacity="0.25" />
                          <polyline points={`0,${maxIntLeague - el.pos[0]} 100,${maxIntLeague - el.pos[1]}`} stroke={Array.isArray(el.colors) ? `url(#gradient${i})` : el.colors} strokeWidth={`${Math.abs(el.pos[1] - el.pos[0]) / 15 + (maxIntLeague - minIntLeague) / 100 * 3}`} />
                        </svg>
                      ))*/}
                      {/*<svg className="graph-chunk" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon points="0,100 0,0 100,10 100,100" fill="#996f4c" fillOpacity="0.25" />
                        <polyline points = "0,0 100,10" stroke="#996f4c" strokeWidth="3"/>
                      </svg>
                      <svg className="graph-chunk" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon points="0,100 0,10 100,15 100,100" fill="#996f4c" fillOpacity="0.25" />
                        <polyline points = "0,10 100,15" stroke="#996f4c" strokeWidth="3"/>
                      </svg>*/}
                      {leagueGraph && leagueGraph.map((el, i) => el.days ? (
                        <div className="graph-chunk" style={{flex: `${el.days}`}}>
                          <div className="line" style={{background: el.bgs, clipPath: `polygon(0% 100%, 0% ${Math.abs(el.pos[0] / (maxIntLeague - minIntLeague) * 60 - 100) - 20}%, 100% ${Math.abs(el.pos[1] / (maxIntLeague - minIntLeague) * 60 - 100) - 20}%, 100% 100%)`}}></div>
                        </div>
                      ) : null)}
                    </div>
                  </>
                ) : <Loading />}
              </div>
              <div id="activity">
                {mainPos ?
                  <div id="calendar">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayI) => 
                      <div className="day">
                        <div className="dayname">{day}</div>
                        <div className="graph">
                          {Array.apply(null, {length: 5}).map((el, i) => i == 0 ? (curDay < dayI + 1 ? <div className="rect"></div> : <div className="rect inv"></div>) : i == 4 ? (curDay >= dayI + 1 ? <div className="rect"></div> : <div className="rect inv"></div>) : <div className="rect"></div>)}
                        </div>
                      </div>
                    )}
                  </div>
                : <Loading />}
              </div>
            </div>
            <div id="main">
              <div id="matches-wr">
                {matches ?
                  matches.length ?
                    <DoubleScrollbar childRef={ref => matchesRef = ref} updateScroll={ref => updateScroll.current = ref} init={() => updateScroll.current()}>
                      <div id="matches" onScroll={() => updateScroll.current()}>
                        <Matches matches={matches} summonerId={summoner.summonerId} />
                      </div>
                    </DoubleScrollbar>
                  : <div className="status">No results</div>
                : <div className="status">Matches loading<Loading /></div>}
              </div>
            </div>
          </>
        }
      </main>
      <div id="nav">
        <Link className="nav-item" exact to={`${match.url}`}>Main</Link>
        <Link className="nav-item" exact to={`${match.url}/matches`}>Matches</Link>
        <Link className={classnames('nav-item', {nowplaying})} to={`/live/${match.params.rg}/${match.params.summonerName}`}>Live</Link>
      </div>
    </div>
  )
}

export { Summoners }