var http = require('http');
var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets;

var fs = require('fs'),
    url = require('url'),
    connect = require('connect'),
    Handlebars = require("handlebars"),
    director = require('director'),
    coffee = require('coffee-script'),
    querystring = require('querystring'),
    _ = require('underscore'),
    async = require('async'),
    dive = require('dive'),
    path = require('path'),
    bower = require('bower');

var cms = {};
cms.m = {};
cms.functions = {};
cms.widgets = {};
cms.events = {};
cms.conditions = {};
cms.actions = {};

registerAllModules();

/*cms.functions.allPagesToStatic();
cms.functions.staticThemeCopy();
cms.functions.staticModulesCopy();*/

var router = new director.http.Router();

function loadPaths() {
  router.on('post', '/post', save);
  router.on('get', '/', view);
  router.on('get', '/hello', view);
}

function loadPages() {
  dive('pages', {}, function(err, file) {
    var pa = path.relative('pages',file).slice(0, -5);
    var ext = path.extname(file);
    if (ext == '.json') {
      router.on('get', pa, view);
    }
  });
}

loadPages();
setTimeout(loadPaths, 100);

var app = connect()
  .use(connect.static('themes/html5up-tessellate/'))
  .use('/files', connect.static('files'))
  .use('/modules', connect.static('modules'))
  .use('/bower_components', connect.static('bower_components'))
  .use(function (req, res) {
    if (req.method == 'POST') {
      processPost(req, res, function() {
        router.dispatch(req, res, router_error);
      });
    } else {
      router.dispatch(req, res, router_error);
    }
  });

http.createServer(app).listen(3000);

console.log('Server running at http://127.0.0.1/');

function registerAllModules() {
  var files = fs.readdirSync('modules');
  _.each(files, function(file) {
    if (file.charAt(0) !== '.' && fs.existsSync('modules/' + file + '/m.js')) {
      registerModule(file);
    }
  });
}

function installDependencies(thing) {
  if (thing.deps) {
    _.each(Object.keys(thing.deps()), function(dep, index) {
      fs.exists('bower_components/' + dep, function (exists) {
        if (!exists) {
          bower.commands
          .install([dep], { save: true }, { /* custom config */ })
          .on('end', function (installed) {
              console.log('bower: installed ' + dep);
          });
        }
      });
    });
  }
}

function registerModule(module) {
  var m = require('./modules/' + module + '/m');
  cms.m[module] = m;
  if (m.register) {
    m.register(cms);
  }

  _.each(m.functions, function(f, name) {
    f.prototype.name = name;
    cms.functions[name] = f;
  });

  _.each(m.widgets, function(widget, name) {
    widget.prototype.name = name;
    cms.widgets[name] = widget;
    installDependencies(new widget({}));
    if (widget.init) {
      widget.init();
    }
  });

  _.each(m.events, function(event, name) {
    event.prototype.name = name;
    cms.events[name] = event;
    installDependencies(new event({}));
  });

  _.each(m.actions, function(action, name) {
    action.prototype.name = name;
    cms.actions[name] = action;
    installDependencies(new action({}));
  });
}

function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

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
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}

var save = function() {
  console.log('POST');
  console.log(this.res.post);

  var that = this;
  var widget_name = this.res.post['widget'];
  delete this.res.post['widget'];
  var widget = new cms.widgets[widget_name](this.res.post);
  if (widget.load) {
    widget.load(function () {
      widget.save(that.res.post);
    });
  } else {
    widget.save(that.res.post);
  }
  this.res.writeHead(204);
  this.res.end();
}

var view = function() {
  var that = this;

  var url_parts = url.parse(this.req.url, true);
  var query = url_parts.query;

  var viewReady = function(html) {
    that.res.writeHead(200, {'Content-Type': 'text/html'});
    that.res.end(html);
  }

  cms.m.pages.functions.viewPage(url_parts.pathname, query, viewReady);  
}

var router_error = function(err) {
  if (err) {
    console.log(err);
    this.res.writeHead(404);
    this.res.end('404');
  }
}