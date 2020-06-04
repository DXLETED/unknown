import React, {useEffect, useState, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'

export const Select = (props) => {
  const settings = useSelector(state => state.settings)
  const dispatch = useDispatch()
  let ref = useRef()
  let id = 'select-' + props.id
  const [open, setOpen] = useState(false)
  const [top, setTop] = useState(false)
  const updatePosition = () => {
    let dropdown = ref.current.getElementsByClassName('dropdown')[0]
    if (document.body.clientHeight - dropdown.offsetTop - dropdown.clientHeight < document.body.clientHeight * 0.05) {
      setTop(true)
    } else {
      setTop(false)
    }
  }
  const update = (e, key) => {
    dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: key}})
    setOpen(false)
    e.stopPropagation()
  }
  const updateState = (e) => {
    if (e.target.closest('.select')) {
      if (e.target.closest('.select') != ref.current) {
        setOpen(false)
      }
    } else {
      setOpen(false)
    }
  }
  useEffect(() => {
    if (!(props.akey in settings)) {
      typeof props.defaultValue !== 'undefined' ? dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: props.defaultValue}}) : dispatch({type: 'UPDATE_SETTINGS', data: {[props.akey]: 0}})
    }
    document.addEventListener('click', updateState)
    window.addEventListener('resize', updatePosition())
  }, [])
  useEffect(() => {
    updatePosition()
  })
  const addActiveClass = (e) => {
    setOpen(true)
    let dropdown = ref.current.getElementsByClassName('dropdown')[0]
    console.log(document.body.clientHeight - dropdown.offsetTop - dropdown.clientHeight)
    e.stopPropagation()
  }
  return (
    <div id={id} className={(props.className ? props.className + ' ' : '') + 'select' + (props.color ? ' select-' + props.color : '') + (open ? ' active' : '') + (top ? ' top' : '')} ref={ref}>
      <div className="selected" onClick={(e) => addActiveClass(e)}>{props.dropdown[settings[props.akey]]}</div>
      <div className="dropdown">{props.dropdown.map((el, i) => <div key={i} className={'selectitem' + (settings[props.akey] === i ? ' active' : '')} onClick={e => update(e, i)}>{el}</div>)}</div>
    </div>
  )
}