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
  register : function(_cms) {
    cms = _cms;
  }
};
var functions = module.exports.functions;
var widgets = module.exports.widgets;

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

functions.findRecord = function(model_name, filter) {
  return wlFilter(cms.model_data[model_name], {
    where: {
      name: { contains: 'lyr' }
    }
  });
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
  mkdirp('data/' + model_name + '/' + path.dirname(record_id));
  fs.writeFile('data/' + model_name + '/' + record_id  + '.json', JSON.stringify(value, null, 4)) ;
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