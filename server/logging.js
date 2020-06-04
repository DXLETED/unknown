require('colors')

const formatTime = i => i < 10 ? '0' + i.toString() : i.toString()

const getTime = () => {
  let d = new Date()
  return `${formatTime(d.getHours())}:${formatTime(d.getMinutes())}:${formatTime(d.getSeconds())}`
}

module.exports = {
  debug(msg) {
    console.log(`${getTime()} | DEBUG |`.white, msg.white, options)
  },
  info(msg) {
    console.log(`${getTime()} | INFO |`.brightCyan, msg.brightCyan)
  },
  warn(msg) {
    console.log(`${getTime()} | WARN |`.brightYellow, msg.brightYellow)
  },
  error(msg) {
    console.log(`${getTime()} | ERROR |`.brightRed, msg.brightRed)
  }
}