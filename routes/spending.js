var express = require('express');
var request = require('request');
var config = require('../config');
var extend = require('util')._extend;
var router = express.Router();

var requestTemplate = {
	uri: ['https://script.googleapis.com/v1/scripts/', config.appScriptInfo.projectId, ':run'].join(''),
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	auth: {
		bearer: ''
	}
};

router.get('/', ensureAuthenticated, function(req, res, next){
	var options = extend({}, requestTemplate)
		, offset = req.query.offset || 10;;

	options.auth.bearer = req.user.token;
	options.body = JSON.stringify({
	    devMode: true,
	    function: 'getRecentDataOrderByDesc',
	    parameters: [offset]
	});

	req.options = options;
	next();
}, commonRequest);

router.post('/', ensureAuthenticated, function(req, res, next) {
	var options = extend({}, requestTemplate)
		, body = req.body

	options.auth.bearer = req.user.token;
	options.body = JSON.stringify({
	    devMode: true,
	    function: 'addUsage',
	    parameters: [body.note, body.amount, body.dayBackwards, body.paymentType]
	});

	req.options = options;
	next();
}, commonRequest);

router.get('/total', ensureAuthenticated, function(req, res, next) {
	var options = extend({}, requestTemplate);

	options.auth.bearer = req.user.token;
	options.body = JSON.stringify({
	    devMode: true,
	    function: 'getTotalSpending'
	});

	req.options = options;
	next();
}, commonRequest);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  next({
  	status: 401,
  	message: "Unauthorized"
  });
}

function commonRequest(req, res, next) {
	var parsed = {};

	request(req.options, function(err, response, body) {
		if (err) {
			next({
				message: err
			});
		}

		parsed = JSON.parse(body);

		res.json(parsed.response.result);
	});
}

module.exports = router;


