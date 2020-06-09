import React, { useState } from 'react'
import classnames from 'classnames'

export const ConfInput = props => {
  const [value, setValue] = useState(props.value ? props.value : '')
  props.updateValue && props.updateValue(data => setValue(data))
  props.getValue && props.getValue(() => value)
  return (
    <div className={classnames('confInput', props.className)}>
      <input type={props.type ? props.type : 'text'} defaultValue={value} onKeyUp={e => e.keyCode == 13 && props.confirm && props.confirm()} onChange={e => setValue(e.target.value)} spellCheck={false} />
      <div className="confirm" onClick={props.confirm && props.confirm}><img src="/static/img/done.png" /></div>
    </div>
  )
}