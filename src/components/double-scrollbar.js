import React, { useRef, Children, useEffect } from 'react'
import ReactDOM from 'react-dom'

export const DoubleScrollbar = props => {
  let scrollWrRef1 = useRef()
  let scrollWrRef2 = useRef()
  let scrollRef1 = useRef()
  let scrollRef2 = useRef()
  let ref = useRef()
  const updateScroll = () => {
    scrollRef1.current.style.height = `${ref.current.scrollHeight}px`
    scrollRef2.current.style.height = `${ref.current.scrollHeight}px`
    scrollWrRef1.current.scrollTop = ref.current.scrollTop
    scrollWrRef2.current.scrollTop = ref.current.scrollTop
  }
  props.childRef && props.childRef(ref)
  props.updateScroll && props.updateScroll(updateScroll)
  useEffect(() => {
    props.init && props.init()
    updateScroll()
    window.addEventListener('resize', updateScroll)
    return () => window.removeEventListener('resize', updateScroll)
  }, [])
  //const childrenElement = React.Children.only(props.children)
  return (
    <>
      <div className="double-scroll-wr" ref={scrollWrRef1}><div className="double-scroll" ref={scrollRef1}></div></div>
      {React.cloneElement(props.children, {ref: ref, onScroll: updateScroll})}
      <div className="double-scroll-wr" ref={scrollWrRef2}><div className="double-scroll" ref={scrollRef2}></div></div>
    </>
  )
}