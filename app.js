var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var winston = require('winston');
var google = require('googleapis');
var config = require('./config');
var routes = require('./routes/index');
var googleAuth = require('./routes/googleauth');
var spending = require('./routes/spending');
var app = express();

// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/
// and choose index of redirect uris in config
var GOOGLE_CLIENT_ID = config.googleOauthJson.web.client_id
    , GOOGLE_CLIENT_SECRET = config.googleOauthJson.web.client_secret
    , REDIRECT_URL = config.googleOauthJson.web.redirect_uris[0]
    , OAuth2 = google.auth.OAuth2
    , oauth2Client = new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URL)
    , authCache = {};

// logger setup
winston.add(winston.transports.File, { name:'filelog', filename: config.general.logPath + 'mrspent.log', json: false, 
                                        timestamp: function() {
                                          return new Date();
                                        } });
winston.add(winston.transports.File, { name:'jsonlog', filename: config.general.logPath + 'mrspent_log.json', json: true });
winston.handleExceptions(new winston.transports.File({ filename: config.general.logPath + 'uncaughtExceptions.log' }));
winston.exitOnError = false;
winston.level = config.general.logLevel;

// app variables setup
app.set('views', path.join(__dirname, 'views')) ;
app.set('view engine', 'ejs');
app.set('users', authCache);
app.set('oauth2Client', oauth2Client);

// middlewares
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// routing
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

