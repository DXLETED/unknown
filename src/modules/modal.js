import React, { useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useSelector } from 'react-redux'

export const Modal = (props) => {
  return ReactDOM.createPortal(
    <div id={'modal-' + props.id} className={'modal ' + props.className + (props.visible ? ' visible' : '')} style={props.style}>
      {props.children}
    </div>
  , document.getElementById('modal-wrapper'))
}

export const Overlay = (props) => {
  let settings = useSelector(state => state.settings['overlay-' + props.id])
  if (!settings) {
    settings = {}
  }
  return ReactDOM.createPortal(
    <div id={'overlay-' + props.id} className={'overlay ' + props.className + (settings.visible ? ' open' : '')}>
      {props.children}
    </div>
  , document.getElementById('modal-wrapper'))
}