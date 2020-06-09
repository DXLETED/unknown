import React from 'react'

export const Button = props => {
  const request = src => {
    fetch(src, {headers: {'Authorization': 'Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbiI6ImFkbWluIiwiaWQiOiI1ZTczYTg4NmI5Y2VkZDRlYzg0ODRlODYiLCJleHAiOjE1OTU5NDI3OTEsImlhdCI6MTU5MDc1ODc5MX0.zjQXpq1Q7PlNxuYuX9kIvTGFlYWportb5rXxI_uKiWs'}})
  }
  return <div className="button" onClick={e => {
    props.src && request(props.src)
    props.onClick && props.onClick
  }}>{props.children}</div>
}