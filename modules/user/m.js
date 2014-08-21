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
functions = module.exports.functions;
widgets = module.exports.widgets;

function userMiddleware(req, res, next) {
  global._ = _; // TODO(thomas): This is a TOTAL HACK

  var cookies = new Cookies( req, res, COOKIE_KEYS);
  req.clientID = cookies.get('clientID')
  if (!req.clientID) {
    req.clientID = cms.functions.makeid(12);
    cookies.set('clientID', req.clientID, {signed: true, overwrite: true});
  }
  cms.functions.getRecord('user', req.clientID, function(err, user) {
    req.user = user || {};
    next();
  });
}

functions.isAllowed = function(permission, user) {
  //console.log(permission);
  if (permission) {
    if (permission.role && permission.role.length) {
      if (user) {
        return _.intersection(permission.role, user.roles).length;
      } else {
        return false;
      }
    }
  }

  return true;
}
