var express = require('express');
var request = require('request');
var config = require('../config');
var extend = require('util')._extend;
var router = express.Router();
var simpleCache = {
	total: 0,
	recentList: [],
	updatedTime: null
};
var cacheExpireTime = 3600;

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
	if (simpleCache.updatedTime && (new Date().getTime() - simpleCache.updatedTime) / 1000 < cacheExpireTime) {
		res.json(simpleCache.recentList);
		return;
	}

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
	if (simpleCache.updatedTime && (new Date().getTime() - simpleCache.updatedTime) / 1000 < cacheExpireTime) {
		res.json(simpleCache.total);
		return;
	}

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

		// Simple caching
		switch (JSON.parse(req.options.body).function) {
			case 'getTotalSpending':
				simpleCache.total = parsed.response.result;
				simpleCache.updatedTime = new Date().getTime();
				break;
			case 'getRecentDataOrderByDesc':
				simpleCache.recentList = parsed.response.result;
				simpleCache.updatedTime = new Date().getTime();
				break;
			case 'addUsage':
				simpleCache.updatedTime = null;
				break;
			default:
				break;
		}

		res.json(parsed.response.result);
	});
}

module.exports = router;


