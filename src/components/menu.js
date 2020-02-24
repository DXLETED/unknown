import React, { useState, useEffect, useRef } from 'react'
import { Modal, Overlay } from '../modules/modal'
import { useSelector, useDispatch } from 'react-redux'
import classnames from 'classnames'

export default (props) => {
  let ref = useRef()
  let id = 'menu-' + props.id
  // const [open, setOpen] = useState(false)
  const dispatch = useDispatch()
  const open = useSelector(state => state.menus[props.id])
  const [style, setStyle] = useState({})
  const setOpen = (data) => dispatch({ type: 'UPDATE_MENU', data: { [props.id]: data } })
  const update = (e) => {
    if (!e.target.closest('.menu') && !e.target.closest('.modal')) {
      setOpen(false)
    } else if (e.target.closest('.menu')) {
      if (e.target.closest('.menu') != ref.current) {
        setOpen(false)
      }
    } else if (e.target.closest('modal')) {
      if (e.target.closest('.modal').id != ('modal-' + props.id)) {
        setOpen(false)
      }
    }
  }
  useEffect(() => {
    document.addEventListener('click', (e) => update(e))
  }, [])
  const addActiveClass = (e) => {
    setOpen(true)
  }
  return (
    <div id={id} className={classnames('menu', props.className, {active: open})} ref={ref}>
      <div className="label" onClick={(e) => addActiveClass(e)}>{props.label}</div>
      <Modal id={props.id} className={props.id} visible={open} style={style}>{props.dropdown}</Modal>
      {props.overlay && <Overlay id={props.id} className={props.id} open={true}>{props.overlay}</Overlay>}
    </div>
  )
}