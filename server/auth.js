const jwt = require('express-jwt')

const getTokenFromHeaders = (req) => {
  const { headers: { authorization } } = req
  if(authorization && authorization.split(' ')[0] === 'Token') {
    return authorization.split(' ')[1]
  }
  return null
}

const auth = {
  required: jwt({
    secret: '3c252f3c4279483ab2d5efeb45d7546218fe397fc90962c617b99e04848f4483',
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
  }),
  optional: jwt({
    secret: '3c252f3c4279483ab2d5efeb45d7546218fe397fc90962c617b99e04848f4483',
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
    credentialsRequired: false,
  }),
}

module.exports = auth