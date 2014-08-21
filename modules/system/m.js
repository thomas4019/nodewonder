var Handlebars = require('handlebars'),
  moment = require('moment'),
  _ = require('underscore'),
  deep = require('deep'),
  querystring = require('querystring');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  middleware : [{func: processPost, priority: -3}, {func: postMiddleware, priority: -2}],
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

functions.generateRecordID = function() {
  return cms.functions.makeid(16);
}

functions.retrieve = function(val, otherwise) {
  if (typeof val === 'undefined')
    return otherwise;
  return (typeof val == 'function') ? val() : val;
}

functions.htmlEscape = function(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

functions.getDefaultWidget = function(type) {
  var widgets = cms.model_widgets[type];
  if (widgets)
    return widgets[0].name;
  else
    return null;
}

functions.expandPostValues = function(values) {
  var data = {};
  var tocheck = [];

  _.each(values, function(value, key) {
    var parts = key.split('-');
    if (parts.length >= 2) {
      var current = data;
      for (var i = 1; i < parts.length - 1; i++) {
        var v = parts[i];
        current = current[v] = current[v] || {};
      }
      var last = parts[parts.length - 1];
      if (value == 'new Array') {
        value = [];
        tocheck.push(last);
      }
      if (value == 'new Object') {
        value = {};
        //tocheck.push(last);
      }
      current[last] = value;
    }
  });

  function hasValues(value) {
    if (typeof value == 'object') {
      for (var key in value)
        if (hasValues(value[key]))
          return true;

      return false;
    }

    if (value == '{}')
      return false;

    return value;
  }

  _.each(tocheck, function(key, index) {
    data[key] = _.filter(data[key], function(value) {
      return hasValues(value);
    });
  });

  return data;
}

function postMiddleware(req, res, next) {
  global._ = _; //TODO(thomas): This is a hack, not sure why needed.

  if (req.method == 'POST' && req.url == '/post') {
    console.log('post');
    console.log(res.post);
    var saveResponse = function(err, data) {
      if (err) {
        console.error(500);
        console.error(err);
        res.writeHead(500, {'Content-Type': 'application/json'});
        var toSend = JSON.stringify(err, 0, 2);
        res.write(toSend);
      } else {
        console.log(200);
        console.log(data);
        res.writeHead(200, {'Content-Type': 'application/json'});
        var toSend = JSON.stringify(data, 0, 2);
        res.write(toSend);
      }
      res.end();
    }

    var widget_name = res.post['widget'];
    delete res.post['widget'];
    var widget = cms.functions.newWidget(widget_name);

    var user = {};
    user.clientID = req.clientID;
    user.ip = req.connection.remoteAddress;

    if (widget.load) {
      widget.load(function () {
        results = widget.save(res.post, user, req, res, saveResponse);
      });
    } else {
      results = widget.save(res.post, user, req, res, saveResponse);
    }
  } else {
    next();
  }
}

function processPost(request, response, next) {
    var queryData = "";
    if(typeof next !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            response.post = querystring.parse(queryData);
            next();
        });

    } else {
        next();
    }
}

functions.makeid = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

functions.fillSettings = function(settings, scope, exclude) {
  exclude = exclude;// || ['data'];
  _.each(settings, function(value, key) {
    if (value && (typeof value === 'string') && value.indexOf("{{") != -1 && (!_.contains(exclude, key))) {
      var template = Handlebars.compile(value);
      settings[key] = template(scope);
    }
  })
}
