import React, { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { classnames } from 'classnames'

export const Switch = (props) => {
  const settings = useSelector(state => state.settings)
  const dispatch = useDispatch()
  const update = () => {
    dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: !settings[props.akey]}})
  }
  useEffect(() => {
    if (!(props.akey in settings)) {
      typeof props.defaultValue !== 'undefined' ? dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: props.defaultValue}}) : dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: false}})
    }
  }, [])
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

export const toggleSwitch = props => {
  const settings = useSelector(state => state.settings)
  const dispatch = useDispatch()
  const update = i => {
    dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: i}})
  }
  useEffect(() => {
    if (!(props.akey in settings)) {
      typeof props.defaultValue !== 'undefined' ? dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: props.defaultValue}}) : dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: 0}})
    }
  }, [])
  return (
    <div className="toggleswitch">{props.vars.map((v, i) => <div className={classnames('select', {active: settings[props.akey] === i})} onClick={() => update(i)} key={i}>{v}</div>)}</div>
  )
}