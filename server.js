var http = require('http');

var fs = require('fs'),
    url = require('url'),
    connect = require('connect'),
    Handlebars = require("handlebars"),
    director = require('director'),
    querystring = require('querystring'),
    _ = require('underscore'),
    async = require('async'),
    dive = require('dive'),
    path = require('path'),
    repl = require("repl"),
    bower = require('bower'),
    bowerJson = require('bower-json'),
    dextend = require('dextend'),
    Cookies = require('cookies');

cms = {};
cms.m = {};
cms.functions = {};
cms.widgets = {};
cms.model_widgets = {};
cms.edit_widgets = {};
cms.view_widgets = {};
cms.events = {};
cms.conditions = {};
cms.actions = {};
cms.deps = {};

cms.model_data = {};
cms.pending_forms = {};
cms.pending_processes = {};

/*cms.functions.allPagesToStatic();
cms.functions.staticThemeCopy();
cms.functions.staticModulesCopy();*/

var Widget = function () {};

function retrieve(val) {
  return (typeof val === 'function') ? val() : val;
}

Widget.prototype.html = function () {
  var results = this.results;
  var zone_object = this.getZoneObject();

  if (this.head) {
    _.each(retrieve(this.head), function(head_element) {
      if (!(head_element in results.head_map)) {
        results.head_map[head_element] = true;
        results.head.push(head_element);
      }
    });
  }
  if (this.values) {
    _.extend(results.values, this.values());
  }

  var rel_value = (results.values && this.id in results.values) ? results.values[this.id] : undefined;
  try {
    widget_html = (this.toHTML) ? this.toHTML(zone_object, rel_value) : '';
  } catch(err) {
    console.error("PROBLEM DURING RENDERING");
    console.error(err.stack);
  }

  var wrapper = this.wrapper ? this.wrapper : 'div';

  var style = this.wrapper_style ? ' style="' + retrieve(this.wrapper_style) + '" ' : '';

  var wclass = this.wrapper_class ? retrieve(this.wrapper_class) : '';

  if (wrapper == 'none') {
    return widget_html + '\r\n';
  } else {
    return '<' + wrapper + style + ' class="widget-container widget-' + this.name + ' ' + wclass + '" id="' + this.id + '">' + '\r\n  '
     + widget_html + '\r\n' + '</' + wrapper + '>' + '\r\n';
  }
}

Widget.prototype.getZoneObject = function() {
  var zones = {};

  _.each(this.all_children, function(widgetList, zoneName) {

    var zone = widgetList;

    zone.html = function() {
      var zone_html = '';
      _.each(widgetList, function(w, i) {
        zone_html += w.html(this.values);
      });
      return zone_html;
    }

    zones[zoneName] = zone;
  });

  return zones;
}

Widget.prototype.processData = function(value) {
  return value;
}
Widget.prototype.validateData = function(value) {
  return false;
}

var router = new director.http.Router();

function loadPaths() {
  router.on('post', '/post', save);
}

var allDeps = [];

async.series(
  [registerAllModules,
  registerAllThemes,
  registerModels,
  installAllDeps,
  processDeps],
  function() {
    console.log('the server is ready - running at http://127.0.0.1:3000/');
    console.log('-------------------------------------------------------');
  });

setTimeout(loadPaths, 100);

var app = connect()
  .use(function (req, res, next) {
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
  })
  .use(connect.static('themes/html5up-tessellate/'))
  .use('/files', connect.static('files'))
  .use('/modules', connect.static('modules'))
  .use('/themes', connect.static('themes'))
  .use('/bower_components', connect.static('bower_components'))
  .use(customPageMiddleware)
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

function registerAllModules(callback) {
  console.log('registering modules: ');

  var funcs = [];

  var files = fs.readdirSync('modules');
  _.each(files, function(file) {
    if (file.charAt(0) !== '.' && fs.existsSync('modules/' + file + '/m.js')) {
      funcs.push( function(callback2) {
        registerModule('modules', file, '', callback2);
      });
    }
  });

  async.parallel(funcs, function() {
    callback();
  });
}

function registerAllThemes(callback) {
  console.log('registering themes: ');

  var funcs = [];

  var files = fs.readdirSync('themes');
  _.each(files, function(file) {
    if (file.charAt(0) !== '.' && fs.existsSync('themes/' + file + '/m.js')) {
      funcs.push( function(callback2) {
        registerModule('themes', file, file + '/', callback2);
      });
    }
  });

  async.parallel(funcs, function() {
    callback();
  });
}

function registerModels(callback) {
  _.each(cms.model_data['model'], function(model, type) {
    cms.edit_widgets[type] = cms.edit_widgets[type] || [];
    cms.edit_widgets[type].push('model_form');
  });
  callback();
}

function installAllDeps(callback) {
  console.log('installing bower dependencies: ');

  async.filter(allDeps, function(file, callback) {
    fs.exists('bower_components/' + file, function(exists) {
      callback(!exists);
    });
  }, function(newDeps) {
    bower.commands
      .install(newDeps, { save: true }, { })
      .on('end', function (installed) {
        callback();
      });
  });
}

function processDeps(callback) {
  async.each(allDeps, registerDep, callback);
}

function installDependencies(thing) {
  if (thing.deps) {
    _.each(Object.keys(retrieve(thing.deps)), function(dep, index) {
      if (dep != 'order' && !_.contains(allDeps, dep)) {
        allDeps.push(dep);
      }
    });
  }
}

function registerDep(dep, callback) {
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

    callback();
  });
}

function registerModule(directory, module, prefix, callback) {
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
    widget.prototype = new Widget();
    widget.prototype.name = prefix+name;
    widget.prototype.module = module;
    cms.widgets[prefix+name] = widget;
    var instance = new widget({});
    installDependencies(instance);
    if (widget.init) {
      widget.init();
    }
    if (instance.settings) {
      var settings = retrieve(instance.settings);
      var type;
      _.each(settings, function(field) {
        if (field.name == 'data') {
          type = field.type;
        }
      });
      if (type) {
        cms.edit_widgets[type] = cms.edit_widgets[type] || [];
        cms.model_widgets[type] = cms.model_widgets[type] || [];
        cms.view_widgets[type] = cms.view_widgets[type] || [];
        if (_.contains(instance.tags, 'field_edit')) {
          cms.edit_widgets[type].push(name);
          cms.model_widgets[type][name] = widget;
        }
        if (_.contains(instance.tags, 'field_view')) {
          cms.view_widgets[type].push(name);
        }
      }
    }
    setTags(widget, instance);
  });

  callback();
}

function setTags(widget, instance) {
  widget.prototype.tags = widget.tags || [];

  if (instance.toHTML) {
    widget.prototype.tags.push('view');
  }
  if (instance.makeEventJS) {
    widget.prototype.tags.push('event');
  }
  if (instance.makeActionJS || instance.action || instance.doProcess) {
    widget.prototype.tags.push('action');
  }
  if (instance.execute) {
    widget.prototype.tags.push('executable');
  }
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

  var saveResponse = function(err, data) {
    if (err) {
      that.res.writeHead(500, {'Content-Type': 'application/json'});
      var toSend = JSON.stringify(err, 0, 2);
      that.res.write(toSend);
    } else {
      that.res.writeHead(200, {'Content-Type': 'application/json'});
      var toSend = JSON.stringify(data, 0, 2);
      that.res.write(toSend);
    }
    that.res.end();
  }

  var widget_name = this.res.post['widget'];
  delete this.res.post['widget'];
  var widget = new cms.widgets[widget_name](this.res.post);
  
  var user = {};
  user.clientID = this.req.clientID;
  user.ip = this.req.connection.remoteAddress;

  if (widget.load) {
    widget.load(function () {
      results = widget.save(that.res.post, user, saveResponse);
    });
  } else {
    results = widget.save(that.res.post, user, saveResponse);
  }
}

function customPageMiddleware(req, res, next) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var path = url_parts.pathname.substring(1);

  var scope = {};
  scope.user = req.user;

  cms.functions.viewPage(path, query, scope, function(html, content_type) {
    res.writeHead(200, {'Content-Type': content_type});
    res.end(html);
  }, next);
}

var router_error = function(err) {
  if (err) {
    console.error(err);
    this.res.writeHead(404);
    this.res.end('404');
  }
}

cms.migrate = function() {
  _.each(cms.model_data['custom_page'], function(page, name) {
    //if (name == 'admin/data') {
      page.code = page.code || {};
      if (page.widgets) {
        page.code.widgets = page.widgets;
        delete page.widgets;
      }
      if (page.slotAssignments) {
        page.code.slotAssignments = page.slotAssignments;
        delete page.slotAssignments;
      }
      _.each(page.code.widgets, function(widget, id) {
        if (!widget.input && !widget.settings) {
          var input = widget;
          var new_widget = {input: input, type: widget.type, slots: widget.slots};
          delete input['type'];
          delete input['slots'];
          page.code.widgets[id] = new_widget;
        }
        if (!widget.settings && widget.input) {
          page.code.widgets[id]['settings'] = page.code.widgets[id]['input'];
          delete page.code.widgets[id]['input'];
        }
      });
      cms.functions.saveRecord('custom_page', name, page);
    //}
  });
}

cms.migrate2 = function() {
_.each(cms.model_data['model'], function(model, name) {
    _.each(model.fields, function(field, id) {
      if (field.type == 'String') {
        field.type = 'Text';
      }
    });
    cms.functions.saveRecord('model', name, model);
  });
}

cms.renameWidget = function(old_name, new_name) {
  console.log('renaming ' + old_name + ' to ' + new_name);
  _.each(cms.model_data['model'], function(model, model_name) {
    _.each(model.fields, function(field) {
      if (field.type == 'Widgets') {
        var count = 0;
        _.each(cms.model_data[model_name], function(data, record) {
          var changed = false;
          _.each(data[field.name].widgets, function(widget, id) {
            if (widget.type == old_name) {
              widget.type = new_name;
              changed = true;
              count++;
            }
          });
          if (changed)
            cms.functions.saveRecord(model_name, record, data);
        });
        console.log('modifying: ' + model_name + ':' + field.name + ' ' + count + ' changes');
      }
      if (field.type == 'field') {
        var count = 0;
        _.each(cms.model_data[model_name], function(data, record) {
          var changed = false;
          _.each(data[field.name], function(field, index) {
            if (field.widget == old_name) {
              field.widget = new_name;
              changed = true;
              count++;
            }
          });
          if (changed)
            cms.functions.saveRecord(model_name, record, data);
        });
        console.log('modifying: ' + model_name + ':' + field.name + ' ' + count + ' changes');
      }
    });
  });
}

cms.migrate3 = function() {
  cms.renameWidget('field_text', 'textbox');
  cms.renameWidget('field_text_select', 'select');
  cms.renameWidget('field_boolean', 'checkbox');
}

cms.pending_processes['a'] = {process: 'user_login'};