var express = require('express');
var google = require('googleapis');
var config = require('../config');
var router = express.Router();
var plus = google.plus('v1');

var SCOPES = ['profile', 'https://www.googleapis.com/auth/spreadsheets'];

router.get('/', function(req, res, next) {
  var oauth2Client = req.app.get('oauth2Client')
      , url;

  if (!oauth2Client) {
    return next('OAuth2 module is not initialized.');
  }

  url = oauth2Client.generateAuthUrl({
    access_type: config.appScriptInfo.offline ? 'offline' : 'online'
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
    return next('Authorization error via Google.');
  }
  
  oauth2Client.getToken(code, function(err, tokens) {
    if (err) {
      return next('Failed to issue token.');
    }
    console.log('[TOKEN ISSUED]', tokens);
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