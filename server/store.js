createStore = require('redux').createStore

function reducer(state = {}, action) {
  switch (action.type) {
    case 'UPDATE_RIOTAPIKEY':
      return {...state, ...{riotapikey: action.data}}
    default:
      return state
  }
}
let store = createStore(reducer)
module.exports = store