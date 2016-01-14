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

	// Offline mode
	if (userInfo && config.appScriptInfo.offline && userInfo.tokens.refresh_token) {
		return next();
	}

	// Webapp mode
	if (userInfo &&	new Date().getTime() <= userInfo.tokens.expiry_date) {
		return next(); 
	}

	res.redirect('/auth/google');
}

module.exports = router;