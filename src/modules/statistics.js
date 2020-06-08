import React, { Fragment, useEffect, useState, useRef } from 'react'
import { colors } from '../colorlist'
import { positions } from '../constants/positions'
import classnames from 'classnames'
import { DoubleScrollbar } from '../components/double-scrollbar'
import { Select } from '../components/select'
import { useSelector, useDispatch } from 'react-redux'
import { Route, useParams } from 'react-router'
import { NavLink as Link } from 'react-router-dom'
import { Loading } from '../components/loading'
import { convertHexToRGBA } from '../utils/convertHexToRGBA'
import { Graph } from '../components/graph'

const Champion = props => {
  const settings = useSelector(state => state.settings)
  let champ = props.champ,
    i = props.i
  let stats = assets.championStats[champ.key]
  let mainRef = useRef()
  const [visibleContent, setVisibleContent] = useState(settings.opt_championslist ? false : true)
  useEffect(() => {
    if (settings.opt_championslist) {
      let visibilityUpdate = mainRef.current.offsetTop > props.scrollTop - window.innerHeight * 1 && mainRef.current.offsetTop < props.scrollTop + window.innerHeight * 2
      if (visibilityUpdate !== visibleContent)
        setVisibleContent(visibilityUpdate)
    }
  }, [props.scrollTop])
  useEffect(() => {
    !settings.opt_championslist && setVisibleContent(true)
  }, [settings.opt_championslist])
  return (
    <Link to={`/statistics/${champ.id}`} className={classnames('champion', {active: props.active})} key={i} ref={mainRef}>
      {visibleContent && <><div className="main">
        <div className="name">{champ.name}</div>
        {Object.keys(stats.positions).sort((x, y) => stats.positions[x] < stats.positions[y] ? 1 : -1).map((pos, i) => i <= 1 && stats.positions[pos] >= 0.2 && <div className="pos" key={i}><img src={`/static/img/positions/${pos}.png`} /></div>)}
      </div>
      <div className="rates">
        <div className="stat pickrate"><img src="/static/img/done.png" />0.00%</div>
        <div className="stat winrate"><img src="/static/img/star-wh.png" />{parseFloat((stats.winrate * 100).toFixed(2))}%</div>
        <div className="stat banrate"><img src="/static/img/banned-wh.png" />0.00%</div>
      </div>
      <div className="img" style={{background: `linear-gradient(to right,
        transparent calc(100% - (var(--vh) * var(--sc) * 45)),
        ${colors.lmain} calc(100% - (var(--vh) * var(--sc) * 22.5))),
        url(/static/img/champion-splashes/${champ.key}.jpg) calc(var(--vh) * var(--sc) * -4) calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 30)
        no-repeat`}}></div></>}
    </Link>
  )
}

const Champions = props => {
  const settings = useSelector(state => state.settings)
  let latestScrollTop = useRef(0)
  let currentScrollTop = useRef(0)
  const [scrollTop, setScrollTop] = useState(0)
  let { championAlias } = useParams()
  let mainRef = useRef()
  let champions = props.champions
  let updateScroll = useRef()
  const setScrollTopOpt = pos => {
    currentScrollTop.current = pos
    if (settings.opt_championslist && Math.abs(pos - latestScrollTop.current) > window.innerHeight * 0.5) {
      latestScrollTop.current = pos
      setScrollTop(pos)
    }
  }
  const resizeUpdate = () => {
    setScrollTop(currentScrollTop.current)
  }
  useEffect(() => {
    window.addEventListener('resize', resizeUpdate)
    return () => window.removeEventListener('resize', resizeUpdate)
  }, [])
  useEffect(() => {
    updateScroll.current()
  }, [props.champions])
  return (
    <div className="champions-wr" ref={mainRef}>
      <DoubleScrollbar updateScroll={func => updateScroll.current = func} update={pos => setScrollTopOpt(pos)}>
        <div className="champions">
          {champions.map((champ, i) => {
            let stats = assets.championStats[champ.key]
            return <Champion champ={champ} i={i} key={i} active={championAlias === champ.id} scrollTop={scrollTop} />
          })}
        </div>
      </DoubleScrollbar>
    </div>
  )
}

const ChampionsList = () => {
  const settings = useSelector(state => state.settings)
  const [search, setSearch] = useState()
  const possDefault = Object.fromEntries(positions.map(pos => [pos, false]))
  const [poss, setPoss] = useState(possDefault)
  let inputTimeout = useRef()
  let champions = Object.values(assets.champions).filter(champ => assets.championStats[champ.key])
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
  if (search && search.length)
    champions = champions.filter(champ => assets.championLocales[champ.key].find(name => name.toLowerCase().includes(search.toLowerCase())))
  if (poss && Object.values(poss).find(pos => pos)) {
    champions = champions.filter(champ => {
      let stats = assets.championStats[champ.key]
      return Object.keys(poss).find(pos => poss[pos] && Object.keys(stats.positions).sort((x, y) => stats.positions[x] < stats.positions[y] ? 1 : -1).filter((pos, i) => i <= 1 && stats.positions[pos] >= 0.2).some(p => p === pos))
    })
  }
  return (
    <div className="champions-list">
      <div className="head">Champions<input className="search" placeholder="Search" onChange={e => {
        let value = e.target.value
        inputTimeout.current && clearTimeout(inputTimeout.current)
        inputTimeout.current = setTimeout(() => setSearch(value), 100)
      }} /></div>
      <div className="filters">
        <div className="sorting">Sort by: <Select id="champions-sorting" akey="championsSorting" dropdown={['name', 'pickrate', 'winrate']} color="wh" /></div>
        <div className="positions">{positions.map((pos, i) => <img src={`/static/img/positions/${pos}.png`} className={classnames({active: poss[pos]})} onClick={() => {
          setPoss({...possDefault, [pos]: !poss[pos]})
        }} key={i} />)}</div>
      </div>
      <Champions champions={champions} />
    </div>
  )
}

const ChampionData = props => {
  let { championAlias } = useParams()
  let champion = Object.values(assets.champions).find(champ => champ.id === championAlias)
  let stats = 'key' in champion ? assets.championStats[champion.key] : null
  const canvasRef = useRef()
  return champion && stats && (
    <div className="champion-data">
      <div className="head">
        <div className="positions">{Object.entries(stats.positions).sort(([x1, x], [y1, y]) => x < y ? 1 : -1).filter(([pos, pickrate], i) => i <= 1 && pickrate >= 0.2).map(([pos, pickrate], i) => <div className={classnames('pos', {active: i === 0})} key={i}><div>{pos.toUpperCase()}</div><div>{parseFloat((pickrate * 100).toFixed())}%</div></div>)}</div>
        <div className="info">
          <div className="name">{champion.name}</div>
          <div className="spells"><img className="passive" src={`/static/img/passive/${champion.passive.image.full}`} />{champion.spells.map((spell, i) => <img src={`/static/img/spell/${spell.image.full}`} key={i} />)}</div>
          <div className="img" style={{background: `linear-gradient(to left, transparent calc(100% - (var(--vh) * var(--sc) * 5)), ${colors.lmain} 100%), url(/static/img/champion-splashes/${champion.key}.jpg) 0 calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 60) no-repeat`}} />
        </div>
      </div>
      <div className="stats">
        <div className="rates">
          <div className="rate">
            <Graph dataset={[2,2,3,5,4,1,2,1.5,1.2,1.7,1.8]} color={colors.blue} labels={{'2.5%': {pos: 2.5, color: colors.white}}} />
            <div className="head"><div className="type">Pickrate</div><div className="value">0.00%</div></div>
          </div>
          <div className="rate">
            <Graph dataset={[45,46,50,52,49,48,48,48,49,47]} color={colors.green} labels={{'50%': {pos: 50, color: colors.white}}} />
            <div className="head"><div className="type">Winrate</div><div className="value">{parseFloat((stats.winrate * 100).toFixed(2))}%</div></div>
          </div>
          <div className="rate">
            <Graph dataset={[2,3,5,15,10,3,2,1.5,1.2,1]} color={colors.red} labels={{'3%': {pos: 3, color: colors.white}}} />
            <div className="head"><div className="type">Banrate</div><div className="value">0.00%</div></div>
          </div>
        </div>
        <div className="row">
          <div className="column1">
            <div className="runes">
              <div className="head">Runes</div>
            </div>
          </div>
          <div className="column2">
            <div className="skill-order">
              <div className="head">Skill order</div>
              <div className="body">
                {(() => {
                  let [orderKey, orderStats] = Object.entries(stats.skillOrders)[0]
                  let order = JSON.parse(orderKey)
                  let spells = champion.spells
                  return (
                    order && spells && <>
                      <div className="abilities">
                        <div className="ability Q"><img src={`/static/img/spell/${spells[0].image.full}`} />{[...Array(15)].map((el, i) => <div className={classnames({use: order[i] === 1})} key={i}>{order[i] === 1 && 'Q'}</div>)}</div>
                        <div className="ability W"><img src={`/static/img/spell/${spells[1].image.full}`} />{[...Array(15)].map((el, i) => <div className={classnames({use: order[i] === 2})} key={i}>{order[i] === 2 && 'W'}</div>)}</div>
                        <div className="ability E"><img src={`/static/img/spell/${spells[2].image.full}`} />{[...Array(15)].map((el, i) => <div className={classnames({use: order[i] === 3})} key={i}>{order[i] === 3 && 'E'}</div>)}</div>
                        <div className="ability R"><img src={`/static/img/spell/${spells[3].image.full}`} />{[...Array(15)].map((el, i) => <div className={classnames({use: order[i] === 4})} key={i}>{order[i] === 4 && 'R'}</div>)}</div>
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
            <div className="items">
              <div className="head">Items</div>
              <div className="body">
                {(() => {
                  let builds = Object.keys(stats.items.builds)
                  return builds.slice(0, 3).map((buildStr, i) => {
                    let build = JSON.parse(buildStr)
                    return (
                      <div className="itembuild" key={i}>
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
        </div>
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