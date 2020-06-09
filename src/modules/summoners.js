import React, { Fragment, useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { DraggableCore } from 'react-draggable'
import { colors } from '../colorlist'
import Settings from '../settings'
import { useParams, useLocation, useRouteMatch, Route } from 'react-router'
import classnames  from 'classnames'
import { cssRh } from '../components/cssvars'
import { fetchError } from '../fetcherror'
import { intLeague, intRank, strTier, intTiers, intDivisions } from '../utils/intLeague'
import { rankColor } from '../constants/colorRanks'
import { timeSince } from '../utils/timeSince'
import { romanToInt } from '../utils/romanToInt'
import moment from 'moment'
import { DoubleScrollbar } from '../components/double-scrollbar'
import { positions } from '../constants/positions'
import { queues } from '../constants/queues'
import { NavLink as Link } from 'react-router-dom'
import { Loading } from '../components/loading'
import { Graph } from '../components/graph'

const Matches = props => {
  return (
    <>
      {props.matches && props.summonerId && props.matches.map((m, i) => {
        let user = m.match.participants.find(p => p.participantId === m.match.participantIdentities.find(p2 => p2.player.summonerId === props.summonerId).participantId)
        let img = `/static/img/champion-splashes/${user.championId}.jpg`
        let background = `linear-gradient(to right, transparent calc(100% - (var(--vh) * var(--sc) * 40)), ${colors.lmain} calc(100% - (var(--vh) * var(--sc) * 15))), url(${img}) calc(var(--vh) * var(--sc) * -10) calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 50) no-repeat`
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
                  <img className={'item' + i} src={user.stats['item' + i] ? `http://ddragon.leagueoflegends.com/cdn/10.4.1/img/item/${user.stats['item' + i]}.png` : '/static/img/items/0.png'} key={i} />
                )}
                <div className="s"></div>
                <img className="ward" src={`http://ddragon.leagueoflegends.com/cdn/10.4.1/img/item/${user.stats.item6}.png`} />
              </div>
            </div>
            <div className="players">
              <div className="team1">
                {positions.map((pos, i) => {
                  let pl = m.match.participants.filter(p => p.teamId !== user.teamId).find(p => p.position === pos)
                  let summoner = m.match.participantIdentities.find(summ => summ.participantId === pl.participantId)
                  return (
                    <Link className="pl" to={`/summoners/${props.rg}/${summoner.player.summonerName}`} key={i}>
                      <span className="summonerName">{m.match.participantIdentities.find(p => p.participantId === pl.participantId).player.summonerName}</span>
                      <div className="icon"><img src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${pl.championId}.png`} /></div>
                    </Link>
                  )
                })}
              </div>
              <div className="positions">
                {positions.map((pos, i) => <div key={i}><img src={`/static/img/positions/${pos}.png`} /></div>
                )}
              </div>
              <div className="team2">
                {positions.map((pos, i) => {
                  let pl = m.match.participants.filter(p => p.teamId !== user.teamId).find(p => p.position === pos)
                  let summoner = m.match.participantIdentities.find(summ => summ.participantId === pl.participantId)
                  if (!pl) console.log(m.match)
                  return (
                    <Link className="pl" to={`/summoners/${props.rg}/${summoner.player.summonerName}`} key={i}>
                      <div className="icon"><img src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${pl.championId}.png`} /></div>
                      <span className="summonerName">{m.match.participantIdentities.find(p => p.participantId === pl.participantId).player.summonerName}</span>
                    </Link>
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

const Leaderboard = () => {
  const location = useLocation()
  const [leaderboard, setLeaderboard] = useState()
  const [error, setError] = useState()
  useEffect(() => {
    fetch('/api/v1/leaderboard')
      .then(res => res.json())
      .then(res => {
        if (res.status === 200) {
          setLeaderboard(res.d)
        } else {
          setError(res)
        }
      })
  }, [location])
  return (
    <div className="leaderboard">
      {leaderboard ?
      <>
        <div className="head">
          <div className="profileIcon"></div>
          <div className="summonerName">Name</div>
          <div className="tierrank">Rank</div>
          <div className="lp">LP</div>
          <div className="wins">Wins</div>
          <div className="losses">Losses</div>
        </div>
        {leaderboard.map((summ, i) => <Link to={`summoners/ru/${summ.summonerName}`} className="summ" key={i}>
          <img className="profileIcon" src={`/static/img/profileIcon/29.png`} />
          <div className="summonerName">{summ.summonerName}</div>
          <div className="tierrank">{summ.tier} {summ.rank}</div>
          <div className="lp">{summ.leaguePoints}</div>
          <div className="wins">{summ.wins}</div>
          <div className="losses">{summ.losses}</div>
        </Link>)}
      </>
      : <div className="status">{error ? fetchError(error) : <>Loading leaderboard<Loading /></>}</div>}
    </div>
  )
}

const Summoner = () => {
  let { rg, summonerName } = useParams()
  const [summoner, setSummoner] = useState()
  const [leagues, setLeagues] = useState()
  const [matches, setMatches] = useState()
  const [mainPos, setMainPos] = useState()
  const [nowplaying, setNowPlaying] = useState()
  const [error, setError] = useState()
  const location = useLocation()
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
    setMatches(null)
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
        setError(data)
      }
    }
    return () => ws.current && ws.current.close()
  }, [location])
  let mainLeague = leagues
    ? leagues.find(el => el.queueType == 'RANKED_SOLO_5x5')
      ? leagues.find(el => el.queueType == 'RANKED_SOLO_5x5')
      : {tier: 'UNRANKED', rank: 'I', percentage: 0, wins: 0, losses: 0}
    : null
  return (
    <div className="summoner">
      {summoner ?
        <>
          <main>
            {summoner &&
              <>
                <div id="side">
                  <div id="summoner">
                    <img id="profile-icon" src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summoner.profileIconId}.jpg`} />
                    <div id="summoner-data">
                      <div id="summoner-name"><span>{summoner.summonerName}</span></div>
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
                        <Graph
                          dataset={[2256,2256,2280,2300,2300,2300,2320,2300,2350,2380,2400,2418]}
                          color={rankColor[mainLeague.tier] || colors.grey}
                          labels={Object.fromEntries(Object.entries(intTiers).map(([tier, tierInt]) => Object.entries(intDivisions).map(([div, divInt]) => [`${tier[0]}${romanToInt(div)}`, {pos: tierInt + divInt, color: rankColor[tier]}])).flat())}
                        />
                      </>
                    ) : <Loading />}
                  </div>
                  <div id="activity">
                    {mainPos ?
                      <div id="calendar">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayI) => 
                          <div className="day" key={dayI}>
                            <div className="dayname">{day}</div>
                            <div className="graph">
                              {Array.apply(null, {length: 5}).map((el, i) => i == 0 ? (curDay < dayI + 1 ? <div className="rect" key={i}></div> : <div className="rect inv" key={i}></div>) : i == 4 ? (curDay >= dayI + 1 ? <div className="rect" key={i}></div> : <div className="rect inv" key={i}></div>) : <div className="rect" key={i}></div>)}
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
                            <Matches matches={matches} summonerId={summoner.summonerId} rg={rg} />
                          </div>
                        </DoubleScrollbar>
                      : <div className="status">No results</div>
                    : <div className="status">Loading matches<Loading /></div>}
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
        </>
      : <div className="status">{error ? fetchError(error) : <>Loading summoner<Loading /></>}</div>}
    </div>
  )
}

export const Summoners = () => {
  return (
    <div id="summoners" className="page">
      <Route exact path="/summoners" component={Leaderboard} />
      <Route path="/summoners/:rg/:summonerName" component={Summoner} />
    </div>
  )
}