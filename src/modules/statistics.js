import React, { Fragment, useEffect, useState, useRef } from 'react'
import assets from "../assets"
import { colors } from '../colorlist'
import { positions } from '../constants/positions'
import classnames from 'classnames'
import { DoubleScrollbar } from '../components/double-scrollbar'
import { Select } from '../components/select'
import { useSelector, useDispatch } from 'react-redux'
import { Route, useParams } from 'react-router'
import { NavLink as Link } from 'react-router-dom'

const Champion = props => {
  let champ = props.champ,
    i = props.i
  let stats = assets.championStats[champ.key]
  return (
    <Link to={`/statistics/${champ.id}`} className={classnames('champion', {active: props.active})} key={i} style={{display: props.visible ? 'flex' : 'none'}}>
      <div className="img" style={{background: `linear-gradient(to right,
        transparent calc(100% - (var(--vh) * var(--sc) * 45)),
        ${colors.lmain} calc(100% - (var(--vh) * var(--sc) * 22.5))),
        url(/static/img/champion-splashes/${champ.key}.jpg) calc(var(--vh) * var(--sc) * -4) calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 30)
        no-repeat`}}></div>
      <div className="main">
        <div className="name">{champ.name}</div>
        {Object.keys(stats.positions).sort((x, y) => stats.positions[x] < stats.positions[y] ? 1 : -1).map((pos, i) => i <= 1 && stats.positions[pos] >= 0.2 && <div className="pos" key={i}><img src={`/static/img/positions/${pos}.png`} /></div>)}
      </div>
      <div className="rates">
        <div className="stat pickrate"><img src="/static/img/done.png" />0.00%</div>
        <div className="stat winrate"><img src="/static/img/star-wh.png" />{parseFloat((stats.winrate * 100).toFixed(2))}%</div>
        <div className="stat banrate"><img src="/static/img/banned-wh.png" />0.00%</div>
      </div>
    </Link>
  )
}

const ChampionsList = () => {
  const settings = useSelector(state => state.settings)
  let { championAlias } = useParams()
  const [search, setSearch] = useState()
  const possDefault = Object.fromEntries(positions.map(pos => [pos, false]))
  const [poss, setPoss] = useState(possDefault)
  let inputTimeout = useRef()
  let updateScroll = useRef()
  let champions = Object.values(assets.champions.data).filter(champ => assets.championStats[champ.key])
  if (settings.championsSorting === 0)
    champions = champions.sort((x, y) => x.name > y.name ? 1 : -1)
  if (settings.championsSorting === 1)
    champions = champions.sort((x, y) => {
      let statsX = assets.championStats[x.key]
      let statsY = assets.championStats[y.key]
      return statsX.pickCount < statsY.pickCount ? 1 : -1
    })
  if (settings.championsSorting === 2)
    champions = champions.sort((x, y) => {
      let statsX = assets.championStats[x.key]
      let statsY = assets.championStats[y.key]
      return statsX.winrate < statsY.winrate ? 1 : -1
    })
  useEffect(() => {
    updateScroll.current()
  }, [search, poss])
  /*if (search && search.length)
    champions = champions.filter(champ => search.split('').every(le => champ.name.toLowerCase().includes(le.toLowerCase())))*/
  return (
    <div className="champions-list">
      <div className="head">Champions<input className="search" placeholder="Search" onChange={e => {
        let value = e.target.value
        inputTimeout.current && clearTimeout(inputTimeout.current)
        inputTimeout.current = setTimeout(() => setSearch(value), 250)
      }} /></div>
      <div className="filters">
        <div className="sorting">Sort by: <Select id="champions-sorting" akey="championsSorting" dropdown={['name', 'pickrate', 'winrate']} color="wh" /></div>
        <div className="positions">{positions.map(pos => <img src={`/static/img/positions/${pos}.png`} className={classnames({active: poss[pos]})} onClick={() => {
          setPoss({...possDefault, [pos]: !poss[pos]})
        }} />)}</div>
      </div>
      <div className="champions-wr">
        <DoubleScrollbar updateScroll={func => updateScroll.current = func}>
          <div className="champions">
            {champions.map((champ, i) => {
              let stats = assets.championStats[champ.key]
              return <Champion champ={champ} i={i} key={i} visible={
                /*(search && search.length ? search.split('').every(le => champ.name.toLowerCase().includes(le.toLowerCase())) ? true : false : true) &&*/
                (search && search.length ? assets.сhampionLocales[champ.key].find(name => name.toLowerCase().includes(search.toLowerCase())) ? true : false : true) &&
                (poss && Object.values(poss).find(pos => pos) ? Object.keys(poss).find(pos => poss[pos] && Object.keys(stats.positions).sort((x, y) => stats.positions[x] < stats.positions[y] ? 1 : -1).filter((pos, i) => i <= 1 && stats.positions[pos] >= 0.2).some(p => p === pos)) ? true : false : true)
              } active={championAlias === champ.id} />
            })}
          </div>
        </DoubleScrollbar>
      </div>
    </div>
  )
}

const ChampionData = props => {
  let { championAlias } = useParams()
  let champion = Object.values(assets.champions.data).find(champ => champ.id === championAlias)
  let stats = 'key' in champion ? assets.championStats[champion.key] : null
  return champion && stats && (
    <div className="champion-data">
      <div className="head">
        <div className="name">{champion.name}</div>
        <div className="abilities">{}</div>
        <div className="img" style={{background: `linear-gradient(to left, transparent calc(100% - (var(--vh) * var(--sc) * 5)), ${colors.lmain} 100%), url(/static/img/champion-splashes/${champion.key}.jpg) 0 calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 60) no-repeat`}} />
      </div>
    </div>
  )
}

export const Statistics = props => {
  return (
    <div id="statistics" className="page">
      <main>
        <ChampionsList />
        <Route path="/statistics/:championAlias" component={ChampionData} />
      </main>
    </div>
  )
}