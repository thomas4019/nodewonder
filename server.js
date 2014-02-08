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
    repl = require("repl"),
    bower = require('bower'),
    bowerJson = require('bower-json');

cms = {};
cms.m = {};
cms.functions = {};
cms.widgets = {};
cms.events = {};
cms.conditions = {};
cms.actions = {};
cms.deps = {};

/*cms.functions.allPagesToStatic();
cms.functions.staticThemeCopy();
cms.functions.staticModulesCopy();*/

var router = new director.http.Router();

function loadPaths() {
  router.on('post', '/post', save);
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

registerAllModules();
registerAllThemes();

setTimeout(loadPaths, 100);

var app = connect()
  .use(connect.static('themes/html5up-tessellate/'))
  .use('/files', connect.static('files'))
  .use('/modules', connect.static('modules'))
  .use('/themes', connect.static('themes'))
  .use('/bower_components', connect.static('bower_components'))
  .use(stateMiddleware)
  .use(function (req, res) {
    if (req.method == 'POST') {
      processPost(req, res, function() {
        router.dispatch(req, res, router_error);
      });
    } else {
      router.dispatch(req, res, router_error);
    }
  });

var app2 = http.createServer(app);
app2.listen(3000);
repl.start({prompt: ':', useGlobal:true});

/*var io = require('socket.io').listen(app2)

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});*/

console.log('Server running at http://127.0.0.1/');

function registerAllModules() {
  var files = fs.readdirSync('modules');
  _.each(files, function(file) {
    if (file.charAt(0) !== '.' && fs.existsSync('modules/' + file + '/m.js')) {
      registerModule('modules', file, '');
    }
  });
}

function registerAllThemes() {
  var files = fs.readdirSync('themes');
  _.each(files, function(file) {
    if (file.charAt(0) !== '.' && fs.existsSync('themes/' + file + '/m.js')) {
      registerModule('themes', file, file + '/');
    }
  });
}

function installDependencies(thing) {
  if (thing.deps) {
    _.each(Object.keys(thing.deps()), function(dep, index) {
      if (dep != 'order') {
        fs.exists('bower_components/' + dep, function (exists) {
          if (!exists) {
            bower.commands
            .install([dep], { save: true }, { /* custom config */ })
            .on('end', function (installed) {
                console.log('bower: installed ' + dep);
            });
          } else {
            registerDep(dep);
          }
        });
      }
    });
  }
}

function registerDep(dep) {
  if (cms.deps[dep])
    return;

  cms.deps[dep] = [];

  var folder = 'bower_components/' + dep + '/';
  bowerJson.read(folder + 'bower.json', function (err, json) {
    var html = '';

    if (err) {
      //no bower.json file
      //console.error(err.message);
    } else {
      cms.deps[dep] = json.main;
      if(typeof json.main == 'string') {
        cms.deps[dep] = [json.main];
      } else if (Array.isArray(json.main)) {
        cms.deps[dep] = json.main;
      } else {
        console.log('unexpected bower.json main: ' + dep);
      }
    }
  });
}

function registerModule(directory, module, prefix) {
  var m = require('./' + directory + '/' + module + '/m');
  cms.m[module] = m;
  if (m.register) {
    m.register(cms);
  }

  _.each(m.functions, function(f, name) {
    f.prototype.name = name;
    cms.functions[name] = f;
  });

  _.each(m.widgets, function(widget, name) {
    widget.prototype.name = prefix+name;
    cms.widgets[prefix+name] = widget;
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

function stateMiddleware(req, res, next) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var path = url_parts.pathname;
  console.log(path);

  cms.functions.viewPage(path, query, function(html, content_type) {
    res.writeHead(200, {'Content-Type': content_type});
    res.end(html);
  }, next);
}

var router_error = function(err) {
  if (err) {
    console.log(err);
    this.res.writeHead(404);
    this.res.end('404');
  }
}