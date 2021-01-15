const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const passport = require("passport");

//Schema

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Model

const User = new mongoose.model("user", userSchema);

module.exports = User;
