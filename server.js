var npmMapping = {
  'cookies': 'Cookies',
  'js-beautify': 'beautify_js',
  'deep-extend': 'deepExtend',
  'bower-json': 'bowerJson',
  'handlebars': 'Handlebars',
  'lodash': '_',
};

var modules = ['lodash','http','fs','url','connect','handlebars','querystring',
'async','dive','diveSync','path','bower','bower-json','deep','deep-extend',
'dextend','moment','vm','url','js-beautify','passport','cookies','phantom','mkdirp'];

modules.forEach(function(module) {
  alias = module;
  if (module in npmMapping) {
    alias = npmMapping[module];
  }
  global[alias] = require(module);
});

COOKIE_KEYS = ['4c518e8c-332c-4c72-8ecf-f63f45b4ff56',
  'af15db41-ef32-4a3f-bb15-7edce2e3744c',
  'fd075a38-a4dd-4c98-a552-239c11f6f5f7'];

var webrepl = require('node-web-repl');
// setup your app as normal
webrepl.createServer({
    username: 'thomas',
    password: '123',
    port: 4019,
    host: '127.0.0.1'
});

cms = {
  functions: {},
  widgets: {},
  model_widgets: {},
  edit_widgets: {},
  view_widgets: {},
  deps: {},
  model_data: {
    model: {}
  },
  pending_forms: {},
  pending_processes: {},
  middleware: [],
  settings: {},
  settings_group: 'production',
};

context = {};

actionScript = function() {
  return 'nw.functions.processActionResult("'+this.id+'", new '+this.action+'(nw.functions.fillSettings('+JSON.stringify(this.settings)+', scope, []), ' +
        '"'+this.id+'", scope,'+cms.functions.createHandlersCode(this)+'));';
}

processSetup = function() {
  cms.functions.setupProcess(this.name, this.settings);
}


fs.readFile('page.html', 'utf8', function(err, data) {
  if (err) {
    return console.error(err);
  }
  page_template = Handlebars.compile(data);
});

cms.functions.loadModelIntoMemory = function(model, callback) {
  if (!fs.existsSync('data/' + model + '/'))
    return;

  console.log('loading data for "' + model + '"');

  var models = fs.readdirSync('data/' + model + '/');
  cms.model_data[model] = {};

  diveSync('data/' + model + '/', {}, function(err, file) {
    if (err) {
      console.error(file);
      console.error(model);
      console.trace(err);
      return;
    }

    var key = path.relative('data/' + model + '/',file).slice(0, -5);
    var ext = path.extname(file);
    if (ext == '.json') {
      var record_id = key;
      var data = fs.readFileSync(file, {encoding: 'utf8'});

      if (data) {
        cms.model_data[model] = cms.model_data[model] || {};
        //console.log('parsing ' + file);
        cms.model_data[model][record_id] = JSON.parse(data);
      } else {
        console.error('empty record: ' + model+'-'+record_id);
      }
    }
  });
}

cms.functions.evalFunctions = function(id, object, key) {
  if (object instanceof Array) {
    return object;
  }
  if (object == null) {
    return object;
  }
  if (typeof object == 'object') {
    if ('_is_func' in object && 'javascript' in object) {
      if (!object.args) {
        console.log(id + ' missing args');
      }
      var func = new Function(object.args.join(','), 'if(-1 == "'+id+'".indexOf("Middleware")) { console.log("'+id +'.' +key+'");console.log(arguments); }'+ object.javascript);//.bind(widget);
      return func;
    } else {
      var object2 = _.clone(object);
      for (var key in object) {
        object2[key] = cms.functions.evalFunctions(id, object[key], key);
      }
      return object2;
    }
  }

  return object;
}

Widget = function () {};

Widget.prototype.retrieve = function(val, otherwise) {
  if (typeof val === 'undefined')
    return otherwise;
  return (typeof val === 'function') ? val.call(this) : val;
}

Widget.prototype.safeRetrieve = function(name, otherwise, args) {
  var val = this[name];
  if (typeof val === 'undefined')
    return otherwise;

  try {
    return ((typeof val === 'function') ? val.call(this, args) : val) || otherwise;
  } catch(err) {
    console.error("PROBLEM IN " + this.id + " " + this.name + "." + name + "()");
    console.error(err.stack);
    return otherwise;
  }
}

Widget.prototype.html = function () {
  var results = this.results;

  if (this.head) {
    var headElements = this.safeRetrieve('head');

    if (headElements) {
      headElements.forEach(function(head_element) {
        if (!(head_element in results.head_map)) {
          results.head_map[head_element] = true;
          results.head.push(head_element);
        }
      });
    }
  }

  if (this.settings.label && this.settings.label != '<none>') {
    var label = '<label for="' + this.id + '" style="padding-right: 5px;">' + this.settings.label + ':' + '</label>';
  } else {
    var label = '';
  }
  var widget_html = this.safeRetrieve('toHTML', '', [label]);

  var wrapper = this.safeRetrieve('wrapper', 'div');

  var style = this.wrapper_style ? ' style="' + this.safeRetrieve('wrapper_style') + '" ' : '';

  var wclass = this.safeRetrieve('wrapperClass', '');

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
    zone_html += w.html();
  });
  return zone_html;
}

Widget.prototype.renderSlotIndex = function(slotName, index) {
  return this.slotAssignments[slotName][index].html();
}

Widget.prototype.processData = function(data) {
  return data;
}
Widget.prototype.validateData = function(data) {
  return false;
}

Widget.prototype.weight = 0;

Widget.prototype.init = function() {
  if (this.htmlTemplate) {
    this.htmlCompiled = Handlebars.compile(this.htmlTemplate.htmlmixed);//.bind(null, [this]);
  }
}

Widget.prototype.toHTML = function(label) {
  this.label = label;
  return this.htmlCompiled ? this.htmlCompiled(this) : '';
}

allDeps = [];

var app = connect()
  .use(connect.static('themes/html5up-tessellate/'))
  .use('/', connect.static('files'))
  .use('/modules', connect.static('modules'))
  .use('/themes', connect.static('themes'));

async.series(
  [registerAllThemes,
  initFuncs,
  registerModels,
  addMiddleware,
  initWidgets,
  sortWidgets,
  installAllDeps,
  processDeps
  ],
  function() {
    console.log('the server is ready - running at http://127.0.0.1:3000/');
    console.log('-------------------------------------------------------');
  });

var app2 = http.createServer(app);
app2.listen(3000);
//repl.start({prompt: ':', useGlobal:true});

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
    cms.edit_widgets[type].push('jsoneditor');
  });
  callback();
}

function installAllDeps(callback) {
  console.log('installing bower dependencies('+allDeps.length+'): ');

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

function initFuncs(callback) {
  cms.functions.loadModelIntoMemory('model');
  _.each(cms.model_data.model, function(list, key) {
    if (key != 'model') {
      cms.functions.loadModelIntoMemory(key);
    }
  });

  cms.model_data['model'] = cms.model_data['model'] || {};
  cms.models = cms.model_data['model'];

  _.each(cms.model_data['function'], function(functionData) {
    var func = cms.functions.evalFunctions(functionData.name, functionData);
    cms.functions[func.name] = func.code;
    //console.log(func.code);
  });

  initSandbox = {
    load: cms.functions.loadRecord,
    loadPage: cms.functions.loadPageState,
    query: cms.functions.executeQueryLocally,
    log: console.log
  };
  context = vm.createContext(initSandbox);

  callback();
}

function initWidgets(callback) {

  for(module in cms.m) {
    if (cms.m[module].init) {
      cms.m[module].init();
    }
  }

  _.each(cms.model_data['widget'], function(wData, type) {
    var widget = cms.functions.loadWidget(wData);
    cms.functions.addWidgetType(widget);
  });

  for(type in cms.widgets) {
    if (cms.widgets[type].init) {
      cms.widgets[type].init();
    }
  }

  callback();
}

function sortWidgets(callback) {
  //console.log('sorting widgets');
  cms.model_widgets['Text'].sort(function (a, b) {
    return a.weight || 0 < b.weight || 0;
  });
  cms.edit_widgets['Text'].sort(function (a, b) {
    return a.weight || 0 < b.weight || 0;
  });
  //console.log(cms.model_widgets['Text']);
  callback();
}

function addMiddleware(callback) {
  cms.middleware = [];
  _.each(cms.model_data['middleware'], function(data) {
    var middleware = cms.functions.evalFunctions(data.name, data);
    cms.middleware.push(middleware);
  });

  cms.middleware.sort(function(a, b) {
    return (a.priority || 0) - (b.priority || 0);
  });
  _.each(cms.middleware, function(middleware, index) {
    middleware.code = middleware.code || middleware.func;
    if (middleware.base) {
      app.use(middleware.base, middleware.code);
    } else {
      app.use(middleware.code);
    }
  });
  callback();
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

cms.migrate5 = function() {
  _.forEach(cms.functions, function(f, name) {
    var funcObj = {
      name: name,
      args: cms.getFuncArgs(f),
      code: {
        "_is_func": true,
        "args": cms.getFuncArgs(f),
        "javascript": cms.getFuncBody(f),
      }
    };
    cms.functions.saveRecord('function', name, funcObj);
  });
}

cms.migrate6 = function() {
  _.forEach(cms.middleware, function(m, index) {
    var name = cms.getFuncName(m.func);
    var funcObj = {
      name: name,
      priority: m.priority,
      code: {
        "_is_func": true,
        "args": cms.getFuncArgs(m.func),
        "javascript": cms.getFuncBody(m.func),
      }
    };
    cms.functions.saveRecord('middleware', name, funcObj);
  });
}

cms.migrate7 = function() {
  _.forEach(cms.model_data.function, function(funcData, index) {
    //var func = cms.functions.loadRecord('function', index);
    console.log(index);
    //funcData.callers = [];
    funcData.calls = ['123'];
    cms.functions.saveRecord('function', index, funcData);
  });
}

cms.migrate8 = function() {
  _.forEach(cms.model_data.model, function(model, index) {
    model.schema = {
      fields: {},
      display: {
        "widgets": {
            
        },
        "slotAssignments": {
            "body": [
               
            ]
        }
      }
    };
    model.fields.forEach(function(field) {
      model.schema.fields[field.name] = {
        type: field.type,
        quantity: field.quantity
      }
      var id = field.name; //cms.functions.makeid(8);
      model.schema.display.widgets[id] = {
        type: field.widget,
        slots: {},
        settings: field.settings || {},
        field: field.name,  
        model_type: field.type,
        model: index
      };
      model.schema.display.widgets[id].settings.label = field.name;
      model.schema.display.widgets[id].settings.field_type = field.type;
      model.schema.display.slotAssignments.body.push(id);
    });
    cms.functions.saveRecord('model', index, model);
  });
}

cms.migrate9 = function() {
  _.forEach(cms.model_data.model, function(model, index) {
    delete model.fields;
    cms.functions.saveRecord('model', index, model);
  });
}

cms.migrate10 = function() {
  _.forEach(cms.model_data.form, function(model, index) {
    model.schema = {
      fields: {},
      display: 
        model.Actions,
    };
    model.Form.forEach(function(field) {
      model.schema.fields[field.name] = {
        type: field.type,
        quantity: field.quantity
      }
      var id = field.name; //cms.functions.makeid(8);
      model.schema.display.widgets[id] = {
        type: field.widget,
        slots: {},
        settings: field.settings || {},
        field: field.name,  
        model_type: field.type,
        model: index,
      };
      model.schema.display.widgets[id].settings.label = field.name;
      model.schema.display.widgets[id].settings.field_type = field.type;
      model.schema.display.slotAssignments.body.push(id);
    });
    cms.functions.saveRecord('form2', index, model);
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

cms.getFuncName = function(func) {
  var code = func.toString();
  var begin = code.indexOf('n ') + 1;
  var end = code.indexOf('(');
  return code.substring(begin, end).trim();
}

cms.getFuncBody = function(func) {
  var code = func.toString();
  var begin = code.indexOf('{') + 1;
  var end = code.lastIndexOf('}');
  return beautify_js(code.substring(begin, end).trim());
}

cms.getFuncArgs = function(func) {
  var code = func.toString();
  var begin = code.indexOf('(') + 1;
  var end = code.indexOf(')');
  return code.substring(begin, end).replace(/ /g, "").split(",");
}

cms.test = function() {
  var BASE_URL = 'http://localhost:3000';

  phantom.create(function (ph) {
    var count = 0;
    var pending = 0;
    function finished() {
      if (++count == pending) {
        ph.exit();
        console.log('DONE TESTING');
      }
    }

    var settings = {};
    cms.functions.setupProcess('user_login', settings)
    var data = {
      token: settings.token,
      widget: 'process',
      input: '{"data":{"email":"th4019@gmail.com","password":"123"}}'
    };
    var enc_data = querystring.stringify(data);
    cms.phantomPost(ph, BASE_URL, '/post', 'POST', enc_data, function() {
      _.each(cms.model_data['custom_page'], function(page, url) {
        url = '/'+url;
        if (url.indexOf('%') === -1 && url != '/user/logout') {
          pending++;
          cms.phantomCapture(ph, BASE_URL, url, finished);
        }
      });
      cms.phantomCapture(ph, BASE_URL, '/admin/data/?model=model&record=widget', finished);
      cms.phantomCapture(ph, BASE_URL, '/admin/data/?model=widget&record=button', finished);
      cms.phantomCapture(ph, BASE_URL, '/admin/data/?model=custom_page&record=admin', finished);
      pending += 3;
    });
  });
}

cms.phantomPost = function(ph, base, url, method, data, callback) {
  ph.createPage(function (page) {
    page.set('viewportSize', {width:1024, height:768});
    page.open(base + url, method, data, function (status) {
      console.log('POST ', status);
      callback();
    });
  });
}

cms.phantomCapture = function(ph, base, url, callback, method, data) {
  ph.createPage(function (page) {

    page.set('viewportSize', {width:1024, height:768});
    page.open(base + url, method, data, function (status) {
      console.log('opened page? ', status);
      page.evaluate(function () { return document.title; }, function (result) {
        console.log('Page title is ' + result);
        var filename = url.replace(/\//gi, '-') + '.png';
        page.render('screenshots/current/'+filename);
        callback();
      });
    });
  });
}
