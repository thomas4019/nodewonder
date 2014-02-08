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

widgets.login = function() {
  this.children = function(callback) {
    /*var state = {"start:htmlfile": {
        "path": "login.html"
    }};*/
    var state = {
        "start:form": {'widget': 'login','zones': {'form': ["username", "password", "save"]}},
        "username:field_text" : {"label": "Username"},
        "password:field_text" : {"label": "Password"},
        "save:submit" : {"label": "Login"},
    };
    callback({'body': state});
  }

  this.save = function(values) {
    console.log(values);
  }

  this.toHTML = function(zones) {
    return zones['body'];
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