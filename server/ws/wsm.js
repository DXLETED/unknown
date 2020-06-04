connects = {}

class WSManager {
  addToGroup(group, socket) {
    if (!(group in connects))
      connects[group] = []
    connects[group].push(socket)
  }
  removeFromGroup(group, socket) {
    if (group in connects) {
      connects[group] = connects[group].filter(conn => { conn !== socket })
      if (!(connects[group].length)) {
        delete connects[group]
      }
    }
  }
  send(group, msg) {
    if (group in connects) {
      connects[group].forEach(socket => {
        if (socket.readyState === 1)
          socket.send(msg)
      })
    }
  }
  get(group) {
    if (group in connects)
      return connects[group]
  }
  move(preGroup, newGroup, sockets) {
    if (sockets) {
      sockets.map(socket => {
        this.addToGroup(newGroup, socket)
        this.removeFromGroup(preGroup, socket)
      })
    }
    console.log(connects)
  }
  findAndRemove(socket) {
    Object.keys(connects).map(group => this.removeFromGroup(group, socket))
  }
}

wsm = new WSManager
module.exports = wsm