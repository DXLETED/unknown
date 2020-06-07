import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import classnames from 'classnames'

export const LoadStatus = props => {
  const status = useSelector(state => state.loading)
  const [visible, setVisible] = useState(false)
  const [timeRemaning, setTimeRemaning] = useState(false)
  useEffect(() => {
    setTimeout(() => setTimeRemaning(true), 2000), []
  }, [])
  useEffect(() => {
    if (timeRemaning) status === 1 ? setVisible(false) : setVisible(true)
  }, [status])
  return visible &&
    <div className={classnames('title', props.className)}>
      Loading images
      <div className="bar" style={{width: status * 100 + '%'}}></div>
    </div>
}