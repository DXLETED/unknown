connects = {}

class WSManager {
  addToGroup(group, socket) {
    if (!(group in connects))
      connects[group] = []
    connects[group].push(socket)
  }
  removeFromGroup(group, socket) {
    connects = connects[group].filter(conn => { conn !== socket })
  }
  send(group, msg) {
    if (group in connects) {
      connects[group].forEach(socket => {
        socket.send(msg)
      })
    }
  }
}

wsm = new WSManager
module.exports = wsm