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

var COOKIE_KEYS = ['4c518e8c-332c-4c72-8ecf-f63f45b4ff56',
  'af15db41-ef32-4a3f-bb15-7edce2e3744c',
  'fd075a38-a4dd-4c98-a552-239c11f6f5f7'];

function userMiddleware(req, res, next) {
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
  console.log(permission);
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

widgets.user_login = {
  settingsModel: [{"name": "email", "type": "Text"},
    {"name": "password", "type": "Text"}],
  slots: ['success', 'failure'],
  slot_tags: {success: ['action'], failure: ['action']},
  action: function(settings, id, scope, handlers) {
    var data = {email: settings.email, password: settings.password};
    nw.functions.doProcess(settings.token, {data: data}, function(result) {
      handlers.success();
    }, handlers.failure);
  },
  setup: function() {
    cms.functions.setupProcess('user_login', this.settings);
  },
  doProcess: function(input, callback) {
    var cookies = new Cookies( this.req, this.res, COOKIE_KEYS);
    cms.functions.findOneByField('user', 'email', input.data.email, function(err, data) {
      if (err) {
        callback('invalid');
        return
      }
      if (data.password == input.data.password) {
        cookies.set('clientID', data.clientID, {signed: true, overwrite: true});
        callback(undefined, data);
        return;
      } else {
        callback('invalid');
      }
    });
  }
}

widgets.user_logout = {
  slots: ['success', 'failure'],
  slot_tags: {success: ['action'], failure: ['action']},
  action: function(settings, id, scope, handlers) {
    nw.functions.doProcess(settings.token, {}, function(result) {
      handlers.success();
    }, handlers.failure);
  },
  setup: function() {
    cms.functions.setupProcess('user_logout', this.settings);
  },
  doProcess: function(input, callback) {
    var cookies = new Cookies( this.req, this.res, COOKIE_KEYS);
    cookies.set('clientID', '', {signed: true, overwrite: true, expires: new Date(1) });
    console.log('logged out');
    callback(undefined, 'success');
  }
}

widgets.get_record = {
  doProcess: function() {

  }
}

widgets.flash_set = {
  slots: ['actions'],
  slot_tags: {actions: ['action']},
  script: function() {
    return 'sessionStorage.setItem("flash", \'' + JSON.stringify(cms.functions.concatActions(this.slotAssignments.actions)) + '\');'
  }
}

widgets.flash_get = {
  tags: ['view'],
  script: function() {
    return 'eval(JSON.parse(sessionStorage.getItem("flash")))';
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