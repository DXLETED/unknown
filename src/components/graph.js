import React, { useEffect, useRef, useState } from 'react'
import classnames from 'classnames'
import { convertHexToRGBA } from '../utils/convertHexToRGBA'
import { colors } from '../colorlist'

export const Graph = props => {
  let dataset = props.dataset
  let labels = props.labels || null
  const [width, setWidth] = useState(props.width)
  let strokeWidth = props.strokeWidth || 2
  let labelsWidth = props.labelsWidth || '4vh'
  let margin = props.margin || 0.2
  let color = props.color || colors.blue
  let fill = props.fill || convertHexToRGBA(color, 0.2)
  let maxValue = Math.max.apply(null, dataset)
  let minValue = Math.min.apply(null, dataset)
  let diff = maxValue - minValue
  let scale = diff / 100
  let mainRef = useRef()
  const updateWidth = () => setWidth(mainRef.current.clientWidth / mainRef.current.clientHeight * 100 / (dataset.length - 1))
  useEffect(() => {
    if (!width) {
      updateWidth()
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }
  }, [])
  return (
    <div id={props.id} className={classnames('graph', props.className)}>
      <svg className="graph-svg" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width * (dataset.length - 1) || 0} 100`} ref={mainRef}>
        {width && labels && Object.values(labels).map((d, i) => {
          let pos = diff / scale * margin + (maxValue - d.pos) / scale * (1 - margin * 2)
          return pos >= 0 && pos <= 100 && <line x1="0" y1={pos} x2={width * dataset.length} y2={pos} stroke={convertHexToRGBA(d.color, 0.5)} strokeWidth={strokeWidth} strokeDasharray="2,1" key={i} />
        })}
        {width && dataset.map((d, i) => {
          if (i === 0) return
          let pos1 = diff / scale * margin + (maxValue - dataset[i - 1]) / scale * (1 - margin * 2)
          let pos2 = diff / scale * margin + (maxValue - d) / scale * (1 - margin * 2)
          let posX1 = (i - 1) * width
          let posX2 = i * width
          return (
            <React.Fragment key={i}>
              <polygon points={`${posX1},100 ${posX1},${pos1} ${posX2},${pos2} ${posX2},100`} fill={fill} />
              <line x1={posX1} y1={pos1} x2={posX2} y2={pos2} stroke={color} strokeLinecap="round" strokeWidth={strokeWidth} />
            </React.Fragment>
          )
        })}
      </svg>
      {labels && 
        <div className="labels" style={{width: labelsWidth}}>
          {Object.entries(labels).map(([label, d], i) => {
            let pos = diff / scale * margin + (maxValue - d.pos) / scale * (1 - margin * 2)
            return pos >= 0 && pos <= 100 && <div className="label" style={{top: pos + '%', color: convertHexToRGBA(d.color, 0.75)}} key={i}>{label}</div>
          })}
        </div>
      }
      <div className="highlight" style={{width: labels ? `calc(100% - ${labelsWidth})` : '100%'}}>
        {dataset.map((d, i) => i !== 0 && <div className="chunk" key={i}></div>)}
      </div>
    </div>
  )
}