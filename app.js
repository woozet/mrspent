var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var methodOverride = require('method-override');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var refresh = require('passport-oauth2-refresh');
var config = require('./config');

var routes = require('./routes/index');
var googleAuth = require('./routes/googleauth');
var spending = require('./routes/spending');

var app = express();

var authCache = {};

// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/
var GOOGLE_CLIENT_ID = config.googleOauthJson.web.client_id;
var GOOGLE_CLIENT_SECRET = config.googleOauthJson.web.client_secret;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('users', authCache);

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, 'public')));

var strategy = new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: config.googleOauthJson.web.redirect_uris[0]  // Choose index of redirect uris in config
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      authCache[profile.id] = {
        profile: profile,
        accessToken: accessToken,
        refreshToken: refreshToken,
        issued: new Date().getTime()
      };

      console.log('Log user info :', profile);
      console.log('Log user token :', accessToken);
      console.log('Log user refresh :', refreshToken);
      return done(null, profile);
    });
  }
);

passport.use(strategy);
refresh.use(strategy);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


app.use('/', routes);
app.use('/auth/google', googleAuth);
app.use('/api/v1/spending', spending);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});


module.exports = app;
