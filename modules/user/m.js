var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.user_login = function() {
  this.settings = [{"name": "username", "type": "Text"},
    {"name": "password", "type": "Text"}];

  this.doProcess = function() {

  }
}

widgets.user_logout = function() {
  this.doProcess = function() {

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