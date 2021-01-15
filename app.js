//! Main Settings
//* Dependencies
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;

// Variables
const app = express();
const User = require("./models/user");

//* App Settings
app.use(express.urlencoded({ extend: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//*Strategies session settings
//User session settings
passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
//Google Strategy API
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_KEY,
      callbackURL: "http://localhost:3000/auth/google/login",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log("profile displayname", profile.displayName);
      console.log("profile name", profile.name);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// Local Strategy API
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    function (email, password, done) {
      User.findOne({ email: email }, function (err, user) {
        if (err) {
          console.log("TEST ERR", err);
          return done(err);
        }
        if (!user) {
          console.log("TEST !USER");

          return done(null, false, { message: "Incorrect username." });
        } else {
          bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
              console.log(err);
            } else {
              if (result === true) {
                return done(null, user);
              } else {
                return done();
              }
            }
          });
        }
      });
    }
  )
);

//* Database Settings
mongoose.connect("mongodb://localhost:27017/sevenfallenDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

//! Requests

//* User Route

//* Login Route
app
  .route("/login")
  .get((req, res) => {
    res.send("<h1>Login Page</h1>");
  })
  .post(
    passport.authenticate("local", (req, res) => {
      console.log("authentification réussie", req);
    })
  );

//* Register Route

app.route("/register").post((req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    if (!err) {
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
      });

      newUser.save((err) => {
        if (err) {
          console.log(err);
        } else {
          console.log(
            req.body.username + " was successfully added to the database"
          );
        }
      });
    }
  });
});

//* Google route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/login",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/test");
  }
);

//? TEST
app.get("/", (req, res) => {
  res.send("<h1>Home Page</h1>");
});
app.get("/test", function (req, res) {
  res.send("<h1>TEST PAGE</h1>");
});

//! Server settings

const PORT = 3000;

app.listen(PORT, (err) => {
  if (err) {
    console.log("Error : ", err);
  } else {
    console.log("App is running on port", PORT);
  }
});
