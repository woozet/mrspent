var express = require('express');
var config = require('../config');
var router = express.Router();

router.get('/', ensureAuthenticated, function(req, res, next){
  res.render('index', config.documentInfo);
});

router.get('/login', function(req, res, next){
  res.render('login', { user: req.user });
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
});

function ensureAuthenticated(req, res, next) {
	var oauth2Client = req.app.get('oauth2Client')
		, userInfo = req.app.get('users')[req.cookies.SID];

	if (userInfo &&	userInfo.tokens.refresh_token) {
		return next(); 
	}

	res.redirect('/login');
}

module.exports = router;