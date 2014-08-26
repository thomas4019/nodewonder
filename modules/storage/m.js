var fs = require('fs'),
    _ = require('underscore'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    dive = require('dive'),
    diveSync = require('diveSync'),
    wlFilter = require('waterline-criteria'),
    deep = require('deep');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  init: function() {
    _.each(cms.widgets, function(w, name) {
      if (w.doProcess && !w.setup) {
        w.setup = processSetup;
      }
    });
  },
  register : function(_cms) {
    cms = _cms;
  }
};
var functions = module.exports.functions;

function processSetup() {
  cms.functions.setupProcess(this.name, this.settings);
}

functions.loadModelIntoMemory = function(model, callback) {
  if (!fs.existsSync('data/' + model + '/'))
    return;

  console.log('loading data for "' + model + '"');

  var models = fs.readdirSync('data/' + model + '/');
  cms.model_data = cms.model_data || {};
  cms.model_data[model] = {};

  diveSync('data/' + model + '/', {}, function(err, file) {
    if (err) {
      console.trace(err);
      console.error(file);
      console.error(model);
      return;
    }

    var key = path.relative('data/' + model + '/',file).slice(0, -5);
    var ext = path.extname(file);
    if (ext == '.json') {
      var record_id = key;
      var data = fs.readFileSync(file, {encoding: 'utf8'});

      if (data) {
        cms.model_data[model] = cms.model_data[model] || {};
        cms.model_data[model][record_id] = JSON.parse(data);
      } else {
        console.error('empty record: ' + model+'-'+record_id);
      }
    }
  });
}

functions.findOneByField = function(model_name, field, value, callback) {
  for(id in cms.model_data[model_name]) {
    var data = cms.model_data[model_name][id];
    if (data[field] == value) {
      callback(undefined, data, id);
      return;
    }
  }
  callback('not found', undefined);
}

functions.loadRecord = function(model_name, record_id) {
  return cms.model_data[model_name][record_id];
}

//callback = function(err, record)
functions.getRecord = function(model_name, record_id, callback) {
  if (!cms.model_data[model_name]) {
    callback("model not found");
    console.error('model:' + model_name + ' missing');
    return;
  }
  if (!cms.model_data[model_name][record_id]) {
    callback("record not found", undefined);
    return;
  }
  callback(undefined, deep.clone(cms.model_data[model_name][record_id]));
}

functions.saveRecord = function(model_name, record_id, value, callback) {
  if (!cms.models[model_name].storage || cms.models[model_name].storage == 'disk+memory') {
    mkdirp('data/' + model_name + '/' + path.dirname(record_id));
    fs.writeFile('data/' + model_name + '/' + record_id  + '.json', JSON.stringify(value, null, 4)) ;
  }

  if(model_name == 'widget') {
    cms.functions.addWidgetType(cms.functions.loadWidget(value));
    cms.widgets[value.name].init();
  }

  if (!cms.model_data[model_name])
    cms.model_data[model_name] = {};
  cms.model_data[model_name][record_id] = value;
  if (callback)
    callback(undefined,value);
}

functions.deleteRecord = function(model_name, record_id, callback) {
  exists = cms.model_data[model_name] && cms.model_data[model_name][record_id] ? true : false;
  if (exists) {
    delete cms.model_data[model_name][record_id];
    fs.unlink('data/' + model_name + '/' + record_id  + '.json');
  }
  if (callback)
    callback(!exists);
}

functions.wrapInForm = function(html, widget, vars) {
  var out = '<form action="/post" method="post">'
   + '<input type="hidden" name="widget" value="' + widget + '">';

  _.each(vars, function(value, key) {
    out += '<input type="hidden" name="' + key + '" value="' + value + '">';
  });
  out += html;
  out += '</form>';

  return out;
}

functions.evalFunctions = function(widget, object, key) {
  if (object instanceof Array) {
    return object;
  }
  if (object == null) {
    return object;
  }
  if (typeof object == 'object') {
    if ('_is_func' in object && 'javascript' in object) {
      if (!object.args) {
        console.log(widget.name + ' ' + key + ' missing args');
      }
      var func = new Function(object.args.join(','), object.javascript);//.bind(widget);
      return func;
    } else {
      var object2 = _.clone(object);
      for (var key in object) {
        object2[key] = cms.functions.evalFunctions(widget, object[key], key);
      }
      return object2;
    }
  }

  return object;
}
