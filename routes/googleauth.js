var express = require('express');
var google = require('googleapis');
var router = express.Router();
var passport = require('passport');
var plus = google.plus('v1');

var SCOPES = ['profile', 'https://www.googleapis.com/auth/spreadsheets'];

router.get('/', function(req, res, next) {
  var oauth2Client = req.app.get('oauth2Client')
      , url;

  if (!oauth2Client) {
    next('error');
  }

  url = oauth2Client.generateAuthUrl({
    access_type: 'offline'
    , scope: SCOPES
  });

  res.redirect(url);
}
);

router.get('/callback', function(req, res, next) {
  var oauth2Client = req.app.get('oauth2Client')
      , users = req.app.get('users')
      , code = req.query.code;

  if (!code || !oauth2Client) {
    console.log('ddd');
    next('error');
  }
  
  oauth2Client.getToken(code, function(err, tokens) {
    if (err) {
      next('error');
    }
    console.log(tokens);
    oauth2Client.setCredentials(tokens);

    plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
      users[response.id] = {
        profile: response,
        tokens: tokens
      };
      res.cookie('SID', response.id, { expires: new Date(Date.now() + (86400 * 30 * 1000)) });
      res.redirect('/');
    });
  });
});

module.exports = router;