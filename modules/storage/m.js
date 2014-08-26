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
