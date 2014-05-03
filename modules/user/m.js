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
widgets = module.exports.widgets;

function userMiddleware(req, res, next) {
  var cookies = new Cookies( req, res, ['4c518e8c-332c-4c72-8ecf-f63f45b4ff56',
'af15db41-ef32-4a3f-bb15-7edce2e3744c',
'fd075a38-a4dd-4c98-a552-239c11f6f5f7']);
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

widgets.user_login = {
  input: [{"name": "username", "type": "Text"},
    {"name": "password", "type": "Text"}],
  doProcess: function(input, callback) {
    console.log(input);
    cms.functions.getRecord('user', input.username, function(err, data) {
      if (err) {
        callback('invalid');
        return
      }
      callback(undefined, data);
      return;
    });
  }
}

widgets.user_logout = {
  doProcess: function() {

  }
}

widgets.get_record = {
  doProcess: function() {

  }
}

passport.use(new LocalStrategy(
  function(username, password, done) {
    /*User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });*/
    if (username == 'thomas')
      return done(null, user);
    else
      return done(null, false, { message: 'Incorrect username.' });
  }
));