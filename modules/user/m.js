var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Cookies = require('cookies');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  middleware : [{func: userMiddleware, priority: -1}],
  register : function(_cms) {
    cms = _cms;
  }
};

function userMiddleware(req, res, next) {
  var cookies = new Cookies( req, res, COOKIE_KEYS);
  req.clientID = cookies.get('clientID');
  console.log('clientID: ' + req.clientID);
  if (!req.clientID) {
    console.log('NEW USER');
    req.clientID = cms.functions.makeid(12);
    cookies.set('clientID', req.clientID, {signed: true, overwrite: true});
  }
  cms.functions.getRecord('user', req.clientID, function(err, user) {
    req.user = user || {};
    next();
  });
}
