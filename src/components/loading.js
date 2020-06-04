import React from 'react'

export const Loading = props => {
  return <div class="loading"><div class="loading-animation">{[...Array(100)].map(rect => <div class="rect" />)}</div></div>
}