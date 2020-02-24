import React, { Fragment, useEffect } from 'react'
import { useSelector } from 'react-redux'
import colors from './colorlist'
import Settings from './settings'

const Player = (props) => {
  let id = 'player-' + props.id
  let img = `/static/img/champion-splashes/${Math.round(Math.random().toFixed(2) * 100)}.jpg`
  let settings = useSelector(state => state.settings)
  let background = props.teamId == 1 ?
    `linear-gradient(to right, transparent calc(100% - (var(--vh) * var(--sc) * 40)), ${colors.lmain} calc(100% - (var(--vh) * var(--sc) * 15))), url(${img}) calc(var(--vh) * var(--sc) * -10) calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 50) no-repeat`
    : `linear-gradient(to left, transparent calc(100% - (var(--vh) * var(--sc) * 40)), ${colors.lmain} calc(100% - (var(--vh) * var(--sc) * 15))), url(${img}) calc(var(--vh) * var(--sc) * 10) calc(var(--vh) * var(--sc) * -2) / calc(var(--vh) * var(--sc) * 50) no-repeat`
  return (
    <div className="player-wr">
      <div id={id} className="player">
        <div className="main">
          <div className="spells"></div>
          <div className="info">
            <div className="summoner_name">Summoner_name</div>
            <div className="rank">
              <div className="ranklp" style={{color: settings.colored_ranks ? '#409486' : ''}}>P2<div className="lp">50LP</div></div>
              <img className="position" src="/static/img/positions/Position_Plat-Bot.png" />
            </div>
            <div className="winrate">
              <div className="status"><div className="wins"></div></div>
              <div className="text">
                <div className="wins">0W</div>
                <div className="percentage">50%</div>
                <div className="loses">0L</div>
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

class Live extends React.Component {
  render() {
    return (
      <div id="live" className="page">
        <main>
          <div id="team1" className="team">
            <Player id={1} teamId={1} />
            <Player id={2} teamId={1} />
            <Player id={3} teamId={1} />
            <Player id={4} teamId={1} />
            <Player id={5} teamId={1} />
          </div>
          <div id="team2" className="team">
            <Player id={1} teamId={2} />
            <Player id={2} teamId={2} />
            <Player id={3} teamId={2} />
            <Player id={4} teamId={2} />
            <Player id={5} teamId={2} />
          </div>
          <div></div>
        </main>
      </div>
    )
  }
}

export { Live }