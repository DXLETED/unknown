let db
let dbClient
module.exports = () => db
module.exports.client = () => dbClient
module.exports.set = (setDB, setCLIENT) => {
  db = setDB
  dbClient = setCLIENT
}