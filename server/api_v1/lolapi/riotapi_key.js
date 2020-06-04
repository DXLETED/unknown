const db = require('../../db')()

let key

module.exports = () => key
module.exports.set = async set => {
  key = set
}
module.exports.update = async set => {
  key = set
  await db.collection('config').updateOne({key: 'riotapi_key'}, {$set: {key: 'riotapi_key', value: set}})
}