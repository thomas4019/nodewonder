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
var widgets = module.exports.widgets;

function processSetup() {
  cms.functions.setupProcess(this.name, this.settings);
}

functions.loadModelIntoMemory = function(model, callback) {
  if (!fs.existsSync('data/' + model + '/'))
    return;

  //console.log('loading data for "' + model + '"');

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

var copy = function (original) {
  return Object.keys(original).reduce(function (copy, key) {
      copy[key] = original[key];
      return copy;
  }, {});
}

widgets.delete_record = {
  settingsModel: [{"name": "model", "type": "Text"},
    {"name": "record", "type": "Text"}],
  slots: ['success', 'failure'],
  tags: ['filtered'],
  slot_tags: {success: ['action'], failure: ['action']},
  action: function(settings, id, scope, handlers) {
    nw.functions.doProcess(settings.token, {}, handlers.success, handlers.failure);
  },
  doProcess: function(input, callback) {
    cms.functions.deleteRecord(this.settings.model, this.settings.record, function(err) {
      callback(err, {});
    });
  }
}

widgets.if_record_exists = {
  settingsModel: [{"name": "model", "type": "Text"},
    {"name": "field", "type": "Text"},
    {"name": "value", "type": "Text"}],
  slots: ['then', 'else'],
  slot_tags: {then: ['action'], 'else': ['action']},
  action: function(settings, id, scope, handlers) {
    nw.functions.doProcess(settings.token, {value: settings.value}, handlers.then, handlers['else']);
  },
  doProcess: function(input, callback) {
    /*cms.functions.getRecord(this.settings.model, input.record, function(err, data) {
      if (err) {
        callback('false');
      } else {
        callback(undefined, 'true');
      }
    });*/
    cms.functions.findOneByField(this.settings.model, this.settings.field, input.value, function(err, data) {
      if (err) {
        callback('false');
      } else {
        callback(undefined, 'true');
      }
    });
  }
}

widgets.save_record = {
  settingsModel: [{"name": "model", "type": "Text"},
    {"name": "record", "type": "Text"},
    {"name": "data_name", "type": "Text"},
    {"name": "data", "type": "JSON"},
    {"name": "record_id_dest", "type": "Text"}],
  slots: ['success', 'failure'],
  slot_tags: {success: ['action'], failure: ['action']},
  tags: ['filtered'],
  action: function(settings, id, scope, handlers) {
    var data = scope[settings.data_name];
    nw.functions.doProcess(settings.token, {data: data}, function(result) {
      if (settings.record_id_dest) {
        scope[settings.record_id_dest] = result.record;
      }
      handlers.success();
    }, handlers.failure);
  },
  doProcess: function (input, callback) {
    var widget = this;
    var settings = this.settings;
    console.log(input.data);
    console.log(this.user);

    cms.functions.getRecord('model', settings.model, function(err, model) {
      var record = settings.record;
      
      cms.functions.getRecord(settings.model, record, function(err,   old_data) {
        var model_widget = cms.functions.newWidget('model_form', {model: 'model', record: settings.model});
        var processed = model_widget.processData(input.data, old_data, widget.user);
        console.log(processed);

        if (settings.record == 'create') {
          if (model.index) {
            if (processed[model.index]) {
              record = processed[model.index];
            } else {
              record = cms.functions.generateRecordID();
              processed[model.index] = record; 
            }
          }
          else
            record = cms.functions.generateRecordID();
        } else {
          if (model.index) {
            if (old_data[model.index] != processed[model.index]) {
              record = processed[model.index];
              cms.functions.deleteRecord(settings.model, old_data[model.index]);
            }
          }
        }

        cms.functions.saveRecord(settings.model, record, processed, function(err, records) {
          callback(err, {record: record});
        });
      });
    });
  }
}