var _ = require('underscore'),
    fs = require('fs'),
    path = require('path');

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
		fs.readFile('storage/models/' + input.model + '.json', 'utf8', function(err, data3) {
		  if (err) {
		    return console.log(err);
		  }

		  inline = false;

			if (!inline) {
				fs.readFile('storage/models/user.json', function(err, data2) {
					model_values_obj = JSON.parse(data2);
					model_values = flatten({}, id, model_values_obj);
					process();
				});
			} else {
				model_values = input.data;
				process();
			}

			function process() {
			model = JSON.parse(data3);
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
			  	if (widgets) {
			  		var name = Object.keys(widgets)[0];
			  		state["body"][field.name] = {type: name, name: field.name, label: field.name, widget: subtype, model: model, data: model_values_obj[field.name]};
			  	} else {
			  		state["body"][field.name] = {type: 'model_form', model: type, widget: subtype, data: model_values_obj[field.name]};
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

		fs.writeFile('storage/models/user.json', JSON.stringify(data, null, 4));
		console.log(data);
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
		else
			return cms.functions.wrapInForm( slots.body.html(), 'model_form', {model: input.model} );
	}
}