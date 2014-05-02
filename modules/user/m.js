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