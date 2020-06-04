const mongoose = require('mongoose')
const passport = require('passport')
const router = require('express').Router()
const auth = require('../auth')
const Users = mongoose.model('Users')

router

//POST new user route (optional, everyone has access)
.post('/reg', auth.optional, (err, req, res, next) => {
  next()
}, async (req, res, next) => {
  const user = req.body
  if(!user.login) {
    return res.json({
      status: 400,
      error: 'reg-01'
    })
  }
  if(!user.password) {
    return res.json({
      status: 400,
      error: 'reg-02'
    })
  }
  if ((await Users.find({login: user.login}).lean().exec()).length) {
    return res.json({
      status: 400,
      error: 'reg-03'
    })
  }
  const finalUser = new Users(user)
  finalUser.setPassword(user.password)
  return finalUser.save()
    .then(() => res.json({ user: finalUser.toAuthJSON() }))
})

.post('/login', auth.optional, (err, req, res, next) => {
  next()
}, (req, res, next) => {
  //const { body: { user } } = req
  const user = req.body
  if(!user.login) {
    return res.json({
      status: 400,
      error: 'auth-01'
    })
  }
  if(!user.password) {
    return res.json({
      status: 400,
      error: 'auth-02'
    })
  }
  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if(err) {
      return next(err)
    }
    if(passportUser) {
      const user = passportUser
      user.token = passportUser.generateJWT()
      return res.json({ user: user.toAuthJSON() })
    }
    return res.json({
      status: 400,
      message: info.message
    })
  })(req, res, next)
})

//GET current route (required, only authenticated users have access)
.get('/current', auth.required, (err, req, res, next) => {
  if (err.message === 'No authorization token was found')
    return res.json({
      status: 401,
      message: 'auth-01'
    })
  if (err.message === 'invalid signature') {
    return res.json({
      status: 401,
      error: 'auth-02'
    })
  }
  if (err.code === 'invalid_token') {
    return res.json({
      status: 401,
      error: 'auth-03'
    })
  }
  if (err.message === 'jwt expired') {
    return res.json({
      status: 401,
      error: 'auth-04'
    })
  }
}, (req, res, next) => {
  const { payload: { id } } = req
  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.json({
          status: 400
        })
      }
      return res.json({ user: user.toAuthJSON() })
    })
})

module.exports = router