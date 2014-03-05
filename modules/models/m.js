var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
functions = module.exports.functions;
widgets = module.exports.widgets;

functions.generateRecordID = function() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 16; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

functions.list

function flatten(out, prefix, value) {
	if (typeof value == 'object') {
		for (var key in value)
			flatten(out, prefix+'-'+key, value[key])
	} else if(Array.isArray(value)) {
		out[prefix] = '[' + value[0] + ']';
	} else {
		out[prefix] = value;
	}

	return out;
}

widgets.model_form = function(input, id) {
	var count = 0;
	var inline = false;

	var model;
	var model_values;
	var model_values_obj;

	this.children = function(callback) {
		fs.readFile('storage/data/model/' + input.model + '.json', 'utf8', function(err, data3) {
		  if (err) {
		  	console.log('model missing: ' + input.model);
		    return console.log(err);
		  }

		  inline = false;

			if (!inline && input.record != 'create') {
				console.log('loadingi data: ' + input.model + '/' + input.record);
				fs.readFile('storage/data/' + input.model + '/' + input.record + '.json', function(err, data2) {
					if (err) {
						console.log(err);
						model_values_obj = {};
						model_values = {};
						process();
					} else {
						model_values_obj = JSON.parse(data2);
						model_values = flatten({}, id, model_values_obj);
						process();
					}
				});
			} else {
				model_values_obj = input.data;
				model_values = flatten({}, id, model_values_obj);
				process();
			}

			function process() {
			model = JSON.parse(data3);
			console.log(model);
			console.log('&&&&&&&&&&&&&');
		  inline = model.inline;

			  var state = {"body": {}};
			  var index = 0;
			  count = model.fields.length;

			  _.each(model.fields, function(field, index) {
			  	var type = field.type
			  	var subtype;
			  	var model;
			  	if (field.quantity) {
				  	type = 'Array';
				  	if (cms.model_widgets[field.type])
				  		subtype = Object.keys(cms.model_widgets[field.type])[0];
				  	else {
				  		model = field.type;
				  		subtype = 'model_form';
				  	}
			  	}
			  	var widgets = cms.model_widgets[type];
			  	var subdata = (model_values_obj) ? model_values_obj[field.name] : {};
			  	if (widgets) {
			  		var name = Object.keys(widgets)[0];
			  		state["body"][field.name] = {type: name, name: field.name, label: field.name, widget: subtype, model: model, data: subdata};
			  	} else {
			  		state["body"][field.name] = {type: 'model_form', model: type, widget: subtype, data: subdata};
			  	}
			  });

			  if (!inline)
			  	state["body"]["submit"] = {type: 'submit', label: 'Submit'};

			  callback(state);
			}
		});
	}

	this.head = ['<link rel="stylesheet" href="/modules/models/models.css" />'];

	this.save = function (values) {

		var data = {};
		var tocheck = [];
		_.each(values, function(value, key) {
			var parts = key.split('-');
			if (parts.length >= 2) {
				var current = data;
				for (var i = 1; i < parts.length - 1; i++) {
					var v = parts[i];
					current = current[v] = current[v] || {};
				}
				var last = parts[parts.length - 1];
				if (value == 'new Array') {
					value = [];
					tocheck.push(last);
				}
				current[last] = value;
			}
		});

		function hasValues(value) {
			if (typeof value == 'object') {
				for (var key in value)
					if (hasValues(value[key]))
						return true;

				return false;
			}

			return value;
		}

		_.each(tocheck, function(key, index) {
			data[key] = _.filter(data[key], function(value) {
				return hasValues(value);
			});
		});

		mkdirp('storage/data/' + values.model + '/');
		var record = values.record == 'create' ? cms.functions.generateRecordID() : (values.record);
		fs.writeFile('storage/data/' + values.model + '/' + record + '.json', JSON.stringify(data, null, 4));
		cms.model_data[values.model][record] = data;
	}

	this.wrapper_class = function() {
		if (inline)
			return 'inline-model-form';
		else
			return '';
	}

	this.values = function() {
		if (inline)
			return {};
		console.log(model_values);
		return model_values;
	}

	this.toHTML = function(slots) {
		if (inline)
			return slots.body.html();
		else {
			cms.pending_forms['1234aoeu'] = {};
			return cms.functions.wrapInForm( slots.body.html(), 'model_form', {model: input.model, record: input.record} );
		}
	}
}
function loadModelIntoMemory(model) {
	if (!fs.existsSync('storage/data/' + model + '/'))
		return;

	console.log('loading data for "' + model + '"');

  var models = fs.readdirSync('storage/data/' + model + '/');
  cms.model_data = cms.model_data || {};
  cms.model_data[model] = {};
  _.each(models, function(file) {
  	
  	var ext = path.extname(file);
  	if (ext == '.json') {
  		var record_id = file.slice(0, -5);
  		var data = fs.readFileSync('storage/data/' + model + '/' + file, {encoding: 'utf8'});
  		cms.model_data[model][record_id] = JSON.parse(data);
  	}
  });
}
widgets.model_form.init = function() {
	loadModelIntoMemory('model');
	_.each(cms.model_data.model, function(list, key) {
		if (key != 'model') {
			loadModelIntoMemory(key);
		}
	});
}

widgets.model_data_listing = function(input) {
	this.toHTML = function() {

		var html = '';

		html += '<h1>' + input.model + '</h1>';

		html  += '<ul class="list-group">'
		var data = cms.model_data[input.model];
		_.each(data, function(list, key) {
			html += '<li class="list-group-item" >';
			html += '<a href="/admin/data/' + input.model + '/' + key + '/"><span class="glyphicon glyphicon-edit"></span></a> ';
			html += '<a href="/admin/list/' + key + '/">' + key + '</a></li>';
		});

		html += '</ul>';

		html += '<a class="btn btn-primary" href="/admin/create/' + input.model + '/">Create new</a></li>';

		return html;
	}

	this.deps = {'bootstrap': []};
}