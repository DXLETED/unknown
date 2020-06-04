const MongoClient = require('mongodb').MongoClient

module.exports = new Promise(async (res, rej) => {
  const client = await MongoClient.connect('mongodb://localhost:27017', {useUnifiedTopology: true})
  const db = client.db('test')
  res(client)
})