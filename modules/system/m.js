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

function postMiddleware(req, res, next) {
  //global._ = _; //TODO(thomas): This is a hack, not sure why needed.

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

function processPost(req, res, next) {
    var queryData = "";
    if(typeof next !== 'function') return null;

    if(req.method == 'POST') {
        req.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                res.writeHead(413, {'Content-Type': 'text/plain'}).end();
                req.connection.destroy();
            }
        });

        req.on('end', function() {
            res.post = querystring.parse(queryData);
            next();
        });

    } else {
        next();
    }
}
