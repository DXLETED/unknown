import React from 'react'

export const Loading = props => {
  return <div className="loading"><div className="loading-animation">{[...Array(100)].map((rect, i) => <div className="rect" key={i} />)}</div></div>
}