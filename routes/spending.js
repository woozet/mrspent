var express = require('express');
var request = require('request');
var config = require('../config');
var extend = require('util')._extend;
var router = express.Router();
var refresh = require('passport-oauth2-refresh');

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

var requestPreflight = function(req, res, next) {
	var userInfo = req.app.get('users')[req.cookies.SID];

	if (!userInfo) {
		next({
	  		status: 401,
	  		message: "Unauthorized"
	  	});
	}

	var options = extend({}, requestTemplate);

	options.auth.bearer = userInfo.accessToken;
	options.body = JSON.stringify({
	    devMode: true,
	    function: 'getTotalSpending'
	});

	if ((new Date().getTime() - userInfo.issued) / 1000 >= cacheExpireTime) {
		refresh.requestNewAccessToken('google', userInfo.refreshToken, function(err, accessToken, refreshToken) {
			userInfo.accessToken = accessToken;
			userInfo.issued = new Date().getTime();
			req.token = accessToken;

			console.log("New Token :", userInfo.accessToken);

			next();
		});
	} else {
		req.token = userInfo.accessToken;

		console.log("Old Token :", userInfo.accessToken);
		next();
	}
};

router.get('/', requestPreflight, function(req, res, next){
	if (simpleCache.updatedTime && (new Date().getTime() - simpleCache.updatedTime) / 1000 <= cacheExpireTime) {
		res.json(simpleCache.recentList);
		return;
	}

	var offset = req.query.offset || 10;

	req.options = generateOptions(req.token, 'getRecentDataOrderByDesc', [offset]);
	next();
}, commonRequest);

router.post('/', requestPreflight, function(req, res, next) {
	var body = req.body;
		
	req.options = generateOptions(req.token, 'addUsage', [body.note, body.amount, body.dayBackwards, body.paymentType]);
	next();
}, commonRequest);

router.get('/total', requestPreflight, function(req, res, next) {
	if (simpleCache.updatedTime && (new Date().getTime() - simpleCache.updatedTime) / 1000 <= cacheExpireTime) {
		res.json(simpleCache.total);
		return;
	}

	req.options = generateOptions(req.token, 'getTotalSpending');
	next();
}, commonRequest);

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
};

function generateOptions(token, apiName, parameters) {
	var options = extend({}, requestTemplate)
		, body = {
		    devMode: true,
		    function: apiName,
		    parameters: parameters
		};

	if (!parameters) {
		delete body.parameters;
	}

	options.auth.bearer = token;
	options.body = JSON.stringify(body);

	return options;
};

module.exports = router;