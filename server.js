pa_ = require('underscore');

var http = require('http');

_ = require('underscore');
fs = require('fs');
url = require('url');
connect = require('connect');
Handlebars = require("handlebars");
querystring = require('querystring');
async = require('async');
dive = require('dive');
path = require('path');
repl = require("repl");
bower = require('bower');
bowerJson = require('bower-json');
dextend = require('dextend');
beautify_js = require('js-beautify');
deep = require('deep');
deepExtend = require('deep-extend');
dextend = require('dextend');
moment = require('moment');
vm = require("vm");
url = require("url");
beautify_js = require('js-beautify');
passport = require('passport');
LocalStrategy = require('passport-local').Strategy;
Cookies = require('cookies');

COOKIE_KEYS = ['4c518e8c-332c-4c72-8ecf-f63f45b4ff56',
  'af15db41-ef32-4a3f-bb15-7edce2e3744c',
  'fd075a38-a4dd-4c98-a552-239c11f6f5f7'];

var _ = require('underscore');
global._ = _;

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

cms.middleware = [];

cms.settings = {};
cms.settings_group = 'production';

cms.functions.addWidgetType = function(module, name, widgetType) {
  widgetType.name = name;

  /*_.defaults(widgetType, Widget.prototype);
  widgetType.module = module;*/

  widgetType.tags = widgetType.tags || [];
  if (widgetType.toHTML) {
    widgetType.tags.push('view');
  }
  if (widgetType.makeEventJS) {
    widgetType.tags.push('event');
  }
  if (widgetType.makeActionJS || widgetType.action || widgetType.doProcess) {
    widgetType.tags.push('action');
  }
  if (widgetType.action) {
    widgetType.tags.push('local-action');
  }
  if (widgetType.doProcess) {
    widgetType.tags.push('process');
  }
  if (widgetType.execute) {
    widgetType.tags.push('executable');
  }

  if (widgetType.settingsModel) {
    var settings = cms.functions.ret(widgetType.settingsModel);
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
      if (_.contains(widgetType.tags, 'field_edit')) {
        cms.edit_widgets[type].push(name);
        cms.model_widgets[type][name] = widgetType;
      }
      if (_.contains(widgetType.tags, 'field_view')) {
        cms.view_widgets[type].push(name);
      }
    }
  }

  cms.widgets[name] = widgetType;
  installDependencies(widgetType);
}

cms.functions.loadWidget = function(widget) {
  //console.log(widget.name);
  return cms.functions.evalFunctions(widget, widget);
}

cms.functions.evalFunctions = function(widget, object) {
  if (object instanceof Array) {
    return object;
  }
  if (typeof object == 'object') {
    if ('_is_func' in object) {
      var func = new Function(object.args.join(','), object.javascript);//.bind(widget);
      return func;
    } else {
      var object2 = _.clone(object);
      for (var key in object) {
        object2[key] = cms.functions.evalFunctions(widget, object[key]);
      }
      return object2;
    }
  }

  return object;
} // cms.functions.evalFunctions(cms.model_data['widget']['button'])

cms.functions.newWidget4 = function(type, settings, id) {
  //console.log(type);
  var w = Object.create(cms.functions.loadWidget(cms.model_data['widget'][type]));
  _.defaults(w, Widget.prototype);
  w.settings = settings || {};
  if (id) {
    w.id = id;
  }
  if (w.setup)
    w.setup();
  return w;
}

cms.functions.newWidget = function(type, settings, id) { //traditional
  //console.log(type);
  //console.log(cms.widgets[type]);
  var w = Object.create(cms.widgets[type]);
  //console.log(type);
  //console.log(Object.keys(_));
  _.defaults(w, Widget.prototype);
  w.settings = settings || {};
  if (id) {
    w.id = id;
  }
  if (w.setup) {
    //w.name = 1232;
    w.cool = 'hello';
    w.setup.call(w);
  }
  return w;
}

/*cms.functions.allPagesToStatic();
cms.functions.staticThemeCopy();
cms.functions.staticModulesCopy();*/

cms.functions.ret = function(val, otherwise) {
  if (typeof val === 'undefined')
    return otherwise;
  return (typeof val === 'function') ? val() : val;
}

cms.functions.getWidget = function(field, input) {
  var default_widget = cms.functions.getDefaultWidget(field.type);

  var type = field.widget ? field.widget : default_widget;

  if (type == 'model_form') {
    input['model'] = 'model';
    input['record'] = field.type;
    input['inline'] = 'model';
  }

  if (field.quantity) {
    input['quantity'] = field.quantity;
    if (_.contains(cms.widgets[type].tags, 'field_edit_multiple')) {
      //widget itself will do multiple
    } else {
      input['widget'] = type;
      type = 'field_multi';
    }
  }

  if (input && input.data && input.data._func_override) {
    console.log('!!!!!!!!!!!!!!');
    type = 'codemirror';
  }

  return type;
};

var Widget = function () {};

Widget.prototype.ret = function(val, otherwise) {
  if (typeof val === 'undefined')
    return otherwise;
  return (typeof val === 'function') ? val.call(this) : val;
}

Widget.prototype.html = function () {
  var results = this.results;

  if (this.head) {
    _.each(cms.functions.ret(this.head), function(head_element) {
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
  if (this.settings.label && this.settings.label != '<none>') {
    var label = '<label for="' + this.id + '" style="padding-right: 5px;">' + this.settings.label + ':' + '</label>';
  } else {
    var label = '';
  }
  var widget_html = '';
  try {
    widget_html = (this.toHTML) ? this.toHTML(label) : '';
  } catch(err) {
    console.error("PROBLEM DURING RENDERING " + this.name + " " + this.id);
    console.error(err.stack);
  }

  var wrapper = this.ret(this.wrapper, 'div');

  var style = this.wrapper_style ? ' style="' + cms.functions.ret(this.wrapper_style) + '" ' : '';

  var wclass = this.ret(this.wrapperClass, '');

  if (wrapper == 'none') {
    return widget_html + '\r\n';
  } else {
    return '<' + wrapper + style + ' class="widget-container widget-' + this.name + ' ' + wclass + '" id="' + this.id + '">' + '\r\n  '
     + widget_html + '\r\n' + '</' + wrapper + '>' + '\r\n';
  }
}

Widget.prototype.renderSlot = function(slotName) {
  var zone_html = '';
  _.each(this.slotAssignments[slotName], function(w, i) {
    zone_html += w.html(this.values);
  });
  return zone_html;
}

Widget.prototype.processData = function(data) {
  return data;
}
Widget.prototype.validateData = function(data) {
  return false;
}

var allDeps = [];

async.series(
  [registerAllModules,
  registerAllThemes,
  registerModels,
  installAllDeps,
  processDeps,
  addMiddleware,
  initWidgets],
  function() {
    console.log('the server is ready - running at http://127.0.0.1:3000/');
    console.log('-------------------------------------------------------');
  });

var app = connect()
  .use(connect.static('themes/html5up-tessellate/'))
  .use('/files', connect.static('files'))
  .use('/modules', connect.static('modules'))
  .use('/themes', connect.static('themes'));

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

function initWidgets(callback) {

  for(type in cms.widgets) {
    if (cms.widgets[type].init) {
      cms.widgets[type].init();
    }
  }
  for(module in cms.m) {
    if (cms.m[module].init) {
      cms.m[module].init();
    }
  }

  cms.widgets2 = {};
  _.each(cms.model_data['widget'], function(wData, type) {
    var widget = cms.functions.loadWidget(wData);
    cms.widgets[type] = widget;
  });

  callback();
}

function functionName(fun) {
  var ret = fun.toString();
  ret = ret.substr('function '.length);
  ret = ret.substr(0, ret.indexOf('('));
  return ret;
}

function addMiddleware(callback) {
  cms.middleware.sort(function(a, b) {
    return (a.priority || 0) - (b.priority || 0);
  });
  _.each(cms.middleware, function(middleware, index) {
    middleware.name = functionName(middleware.func);
    if (middleware.base) {
      app.use(middleware.base, middleware.func);
    } else {
      app.use(middleware.func);
    }
  });
  callback();
}

function installDependencies(thing) {
  if (thing.deps) {
    _.each(Object.keys(cms.functions.ret(thing.deps)), function(dep, index) {
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
    if (typeof widget != 'function') {
      cms.functions.addWidgetType(module, name, widget);
    } else {
      console.log('invalid widget: ' + name);
    }
  });

  _.each(m.middleware, function(middleware) {
    middleware.module = module;
    cms.middleware.push(middleware);
  });

  callback();
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

cms.migrate4 = function() {
  _.forEach(cms.widgets, function(widget, name) {
    //console.log(widget.tags);

    var widgetData = cms.funcsToString(widget);
    cms.functions.saveRecord('widget', name, widgetData);
  });
}

cms.funcsToString = function(object) {
  var object2 = {};
  var widgetModel = cms.models['widget'];
  var fields = {};
  _.each(widgetModel.fields, function(field) {
    fields[field.name] = field;
  });
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      if (typeof object[key] == 'function') {
        object2[key] = {
          _is_func: true,
          args: fields[key].settings.args || [],
          javascript: cms.getFuncBody(object[key]),
        }
        if (fields[key] && fields[key].type != 'Code') {
          object2[key]['_func_override'] = true;
          //console.log(key+' '+object.name);
        }
      } else {
        object2[key] = object[key];
      }
    }
  }
  return object2
}

cms.getFuncBody = function(func) {
  var code = func.toString();
  var begin = code.indexOf('{') + 1;
  var end = code.lastIndexOf('}');
  return beautify_js(code.substring(begin, end).trim());
}
