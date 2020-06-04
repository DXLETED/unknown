const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const UsersSchema = new Schema({
  login: String,
  hash: String,
  salt: String,
});

UsersSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
};

UsersSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
  return this.hash === hash
};

UsersSchema.methods.generateJWT = function() {
  const today = new Date()
  const expirationDate = new Date(today)
  expirationDate.setDate(today.getDate() + 60)

  return jwt.sign({
    login: this.login,
    id: this._id,
    exp: parseInt(expirationDate.getTime() / 1000, 10),
  }, '3c252f3c4279483ab2d5efeb45d7546218fe397fc90962c617b99e04848f4483')
}

UsersSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    login: this.login,
    token: this.generateJWT(),
  }
}

mongoose.model('Users', UsersSchema)