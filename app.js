var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var google = require('googleapis');
var config = require('./config');
var routes = require('./routes/index');
var googleAuth = require('./routes/googleauth');
var spending = require('./routes/spending');
var app = express();
// var jwtClient = new google.auth.JWT(config.googleOauthJson2.client_email, 
//                                     null, 
//                                     config.googleOauthJson2.private_key, 
//                                     ['https://www.googleapis.com/auth/spreadsheets'], 
//                                     null);

// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/
// and choose index of redirect uris in config
var GOOGLE_CLIENT_ID = config.googleOauthJson.web.client_id
    , GOOGLE_CLIENT_SECRET = config.googleOauthJson.web.client_secret
    , REDIRECT_URL = config.googleOauthJson.web.redirect_uris[0]
    , OAuth2 = google.auth.OAuth2
    , oauth2Client = new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URL)
    , authCache = {};

// view engine setup
app.set('views', path.join(__dirname, 'views')) ;
app.set('view engine', 'ejs');
app.set('users', authCache);
app.set('oauth2Client', oauth2Client);

// jwtClient.authorize(function(err, tokens) {
//   if (err) {
//     console.log(err);
//   }

//   app.set('jwtClient', jwtClient);
// });

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
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
