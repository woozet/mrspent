var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/',
  passport.authenticate('google', { accessType: 'offline', scope: ['profile', 'https://www.googleapis.com/auth/spreadsheets'] })
);

router.get('/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res, next) {
  	res.cookie('SID', req.user.id, { expires: new Date(Date.now() + 900000) });
    res.redirect('/');
  });

module.exports = router;