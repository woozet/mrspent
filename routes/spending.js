var express = require('express');
var google = require('googleapis');
var config = require('../config');
var extend = require('util')._extend;
var router = express.Router();
var script = google.script('v1');

var simpleCache = {
	total: 0,
	recentList: [],
	updatedTime: null
};
var cacheExpireTime = 3600;

var requestTemplate = {
	scriptId: config.appScriptInfo.projectId,
	resource: {
		devMode: true
	}
};

var prepareRequest = function(req, res, next) {
	var oauth2Client = req.app.get('oauth2Client')
		, userInfo = req.app.get('users')[req.cookies.SID]
		, options;

	if (!userInfo) {
		return next({
	  		status: 401,
	  		message: 'Unauthorized'
	  	});
	}

	console.log('[REQUEST TOKEN PROFILE]', userInfo.tokens);
	
	oauth2Client.setCredentials(userInfo.tokens);
	oauth2Client.getAccessToken(function(err, token, response) {
		if (err) {
			console.log('[TOKEN REFRESH ERROR]', err);
			return next({
				status: err.code,
				message: err.errors && err.errors.length > 0 ? err.errors[0].message : ''
			});
		}

		// update auth cache
		if (response) {
			console.log('[TOKEN REFRESH RESPONSE]', response.body);
			userInfo.tokens = response.body;	
		}

		options = extend({}, requestTemplate);
		options.auth = oauth2Client;
		req.options = options;

		next();
	});
};

function doRequest(req, res, next) {
	var parsed = {};

	script.scripts.run(req.options, function(err, response) {
		if (err) {
			console.log('[ERROR]', err);
			return next({
				status: err.code,
				message: err.errors && err.errors.length > 0 ? err.errors[0].message : ''
			});
		}

		console.log('[RESPONSE]', response);
		doCache(response.name, response.response);
		res.json(response.response.result);
	});
}

function doCache(functionName, response) {
	// Simple caching
	switch (functionName) {
		case 'getTotalSpending':
		console.log(response);
			simpleCache.total = response.result;
			simpleCache.updatedTime = new Date().getTime();
			break;
		case 'getRecentDataOrderByDesc':
			simpleCache.recentList = response.result;
			simpleCache.updatedTime = new Date().getTime();
			break;
		case 'addUsage':
			simpleCache.updatedTime = null;
			break;
		default:
			break;
	}
}

// Let's routing...
router.get('/', prepareRequest, function(req, res, next){
	var offset = req.query.offset || 10;

	if (simpleCache.updatedTime && (new Date().getTime() - simpleCache.updatedTime) / 1000 <= cacheExpireTime) {
		return res.json(simpleCache.recentList);
	}

	req.options.resource.function = 'getRecentDataOrderByDesc';
	req.options.resource.parameters = [offset];	

	next();
}, doRequest);

router.post('/', prepareRequest, function(req, res, next) {
	var body = req.body;

	req.options.resource.function = 'addUsage';
	req.options.resource.parameters = [body.note, body.amount, body.dayBackwards, body.paymentType];	
	
	next();
}, doRequest);

router.get('/total', prepareRequest, function(req, res, next) {
	if (simpleCache.updatedTime && (new Date().getTime() - simpleCache.updatedTime) / 1000 <= cacheExpireTime) {
		return res.json(simpleCache.total);
	}

	req.options.resource.function = 'getTotalSpending';
	
	next();
}, doRequest);

module.exports = router;