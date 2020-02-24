import React, { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

export const Switch = (props) => {
  let settings = useSelector(state => state.settings)
  const dispatch = useDispatch()
  let update = () => {
    dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: !settings[props.akey]}})
  }
  return (
    <div className={'switch' + (settings[props.akey] ? ' active' : '')} onClick={update}>{props.label}</div>
  )
}

export const SwitchDefault = (props) => {
  let active = props.defaultValue
  return (
    <div className={'switch' + active ? ' active' : ''} onClick={() => active = !active}></div>
  )
}

export const SwitchMenu = props => {
  let switchmenu = useSelector(state => state.switchmenu)
  const [style, setStyle] = useState()
  const dispatch = useDispatch()
  let update = () => {
    dispatch({type: 'UPDATE_SWITCHMENU', data: {[props.akey]: !switchmenu[props.akey]}})
  }
  useEffect(() => {
    if (switchmenu[props.akey]) {
      setStyle({position: 'relative'})
    } else {
      setTimeout(() => setStyle({position: 'absolute'}), 200)
    }
  }, [switchmenu[props.akey]])
  return (
    <div id={'switchmenu-' + props.id} className={'switchmenu' + (switchmenu[props.akey] ? ' active' : '')}>
      <div className="headline" onClick={update}><img src="/static/img/arrow/white_right.png" />{props.headline}</div>
      <div className="dropdown" style={style}>{props.children}</div>
    </div>
  )
}