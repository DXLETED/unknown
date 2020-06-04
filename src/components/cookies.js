import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useCookies } from 'react-cookie'
import cookie from 'react-cookies'

let defaultCookies = {
  settings: {
    colored_ranks: false
  }
}

let maxAge = 5184000

export default (store, list) => {
  list.map(el => {
    store.dispatch({
      type: 'SET',
      data: {[el]: cookie.load(el) ? cookie.load(el) : {}}
    })
    store.subscribe(() => {
      cookie.save(el, store.getState()[el], {path: '/', maxAge})
    })
  })
}

export const CookieManager = () => {
  const [cookies, setCookie] = useCookies(['settings'])
  const store = useSelector(state => state)
  const dispatch = useDispatch()
  const cookiesOptions = {path: '/', maxAge: 2419200}
  useEffect(() => {
    console.log(cookies)
    for (let name in defaultCookies) {
      if (typeof cookies[name] === 'object') {
        for (let el in defaultCookies[name]) {
          if (!(el in cookies[name])) {
            setCookie(name, {...cookies[name], [el]: defaultCookies[name][el]}, cookiesOptions)
          }
        }
        for (let el in cookies[name]) {
          if (!(el in defaultCookies[name])) {
            setCookie(name, {...cookies[name], [el]: undefined}, cookiesOptions)
          }
        }
      } else {
        setCookie(name, defaultCookies[name], cookiesOptions)
      }
    }
    dispatch({type: 'UPDATE_SETTINGS', data: cookies.settings})
  }, [])
  useEffect(() => {
    setCookie('settings', store.settings, cookiesOptions)
  }, [store.settings])
  return (null)
}