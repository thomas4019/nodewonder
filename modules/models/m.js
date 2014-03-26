var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    Handlebars = require('handlebars'),
    dive = require('dive'),
    diveSync = require('diveSync'),
    deep = require('deep');

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
	return cms.functions.makeid(16);
}

functions.loadRecord = function(model_name, record_id) {
	return cms.model_data[model_name][record_id];
}

//callback = function(err, record)
functions.getRecord = function(model_name, record_id, callback) {
	if (!cms.model_data[model_name]) {
		callback("model not found");
		console.log('model:' + model_name + ' missing');
		return;
	}
	if (!cms.model_data[model_name][record_id]) {
		callback("record not found", undefined);
		return;
	}
	callback(undefined, deep.clone(cms.model_data[model_name][record_id]));
}

functions.saveRecord = function(model_name, record_id, value) {
	fs.writeFile('data/' + model_name + '/' + record_id  + '.json', JSON.stringify(value, null, 4));
}

functions.getDefaultWidget = function(type) {
	var widgets = cms.model_widgets[type];
	if (widgets)
		return Object.keys(widgets)[0];
	else
		return null;
}

functions.expandPostValues = function(values) {
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

	return data;
}

function flatten(out, prefix, value, fields) {
	if (typeof value == 'object' ) {
		//out[prefix] = value;
		for (var key in value)
			flatten(out, prefix+'-'+key, value[key], fields)
	} else if(Array.isArray(value)) {
		out[prefix] = '[' + value[0] + ']';
	} else {
		out[prefix] = value;
	}

	return out;
}

widgets.model_form = function(input, id) {
	var model;
	var model_values;
	var model_values_obj;

	var inline = input.inline;

	if (input.model) {
		model = cms.model_data['model'][input.model];
	}

	this.children = function(callback) {
		if (!inline && input.record != 'create') {
			//console.log('loadingi data: ' + input.model + '/' + input.record);
			cms.functions.getRecord(input.model, input.record, function(err, data2) {
				if (err) {
					console.log(err);
					model_values_obj = {};
					model_values = {};
					process();
				} else {
					model_values_obj = data2;
					//console.log(model.fields);
					model_values = flatten({}, id, model_values_obj, model.fields);
					process();
				}
			});
		} else {
			model_values_obj = input.data;
			model_values = flatten({}, id, model_values_obj, model.fields);
			process();
		}

		function process() {
			//model = JSON.parse(data3);
			//console.log(model);
			//console.log('&&&&&&&&&&&&&');

		  var state = {"body": {}};
		  var index = 0;
		  
		  if (!model) {
		  	console.log("model error");
		  	console.log(input);
		  }
		  _.each(model.fields, function(field, index) {
		  	var subdata = (model_values_obj) ? model_values_obj[field.name] : undefined;
		  	var default_widget = cms.functions.getDefaultWidget(field.type);

		  	var input = field.input || {};
		  	var type;

		  	if (default_widget) {
		  		var name = field.widget ? field.widget : default_widget;
		  		input = _.extend(input, {name: field.name, data: subdata});
		  		type = name;
		  	} else {
		  		input = _.extend({name: field.name, model: field.type, data: subdata, inline: 'model'});
		  		type = 'model_form';
		  	}

		  	if (field.quantity) {
		  		input['widget'] = type;
		  		type = 'field_multi';
		  		input['quantity'] = field.quantity;
		  		input['data'] = model_values_obj.fields;
		  	}

		  	state["body"][field.name] = {type: type, input: input};
		  });

		  if (!inline)
		  	state["body"]["submit"] = {type: 'submit', input: {button_type: 'primary', label: 'Submit'}};

		  callback(state);
		}
	}

	this.head = ['<link rel="stylesheet" href="/modules/models/models.css" />'];

	this.processData = function(data) {

		var out = {};

		_.each(model.fields, function(field) {
			var field_data = data[field.name];
			var widget_name = field.widget ? field.widget : cms.functions.getDefaultWidget(field.type);
			var input = {};
			if (!widget_name) {
				widget_name = 'model_form';
				input['model'] = field.type;
			}

			if (field.quantity) {
				input['widget'] = widget_name;
				widget_name = 'field_multi';
			}
			var widget = new cms.widgets[widget_name](input);
			var processed = widget.processData(field_data);
			out[field.name] = processed;
		});

		return out;
	}

	this.save = function (values) {

		var data = cms.functions.expandPostValues(values);
		var related = cms.pending_forms[data.form_token];
		delete data['form_token'];
		model = related.model;
		var processed = this.processData(data);
		//console.log(related);
		//console.log(processed);

		var dir = 'data/' + related.collection + '/';
		mkdirp(dir);
		var record = related.record;
		if (related.record == 'create') {
			if (related.model.key && processed[related.model.key])
				record = processed[related.model.key];
			else
				record = cms.functions.generateRecordID();
		}
		fs.writeFile(dir + record + '.json', JSON.stringify(processed, null, 4));
		cms.model_data[related.collection][record] = processed;
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
		//return model_values;
	}

	this.toHTML = function(slots) {
		if (inline)
			return slots.body.html();
		else {
			var form_token = cms.functions.makeid(36);
			cms.pending_forms[form_token] = {
				model: model,
				collection: input.model,
				record: input.record
			};
			token = id + '-form_token';
			var values = {};
			values[token] = form_token;
			return cms.functions.wrapInForm( '<h2><a href="/admin/list/model">Models</a> : <a href="/admin/list/' + input.model + '/">' + input.model + '</a> : ' + input.record + '</h2>' +  slots.body.html(), 'model_form',  values);
			//return cms.functions.wrapInForm( slots.body.html(), 'model_form', {model: input.model, record: input.record} );
		}
	}
}
function loadModelIntoMemory(model, callback) {
	if (!fs.existsSync('data/' + model + '/'))
		return;

	console.log('loading data for "' + model + '"');

  var models = fs.readdirSync('data/' + model + '/');
  cms.model_data = cms.model_data || {};
  cms.model_data[model] = {};

  diveSync('data/' + model + '/', {}, function(err, file) {
  	if (err) {
  		console.trace(err);
  		console.log(file);
  		console.log(model);
  		return;
  	}
  	
    var key = path.relative('data/' + model + '/',file).slice(0, -5);
    var ext = path.extname(file);
    if (ext == '.json') {
  		var record_id = key;
  		var data = fs.readFileSync(file, {encoding: 'utf8'});
  		cms.model_data[model] = cms.model_data[model] || {};
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

		var row_template;
		if (input.row_template) {
			row_template = Handlebars.compile(input.row_template);
		}

		var html = '';

		html += '<h1>'
		+ (input.title ? input.title : ('<a href="/admin/list/model">Models</a> : ' + input.model))
		+ '</h1>';

		html  += '<ul class="list-group">'
		var data = cms.model_data[input.model];
		_.each(data, function(list, key) {
			if (!input.row_template) {
				html += '<li class="list-group-item" >';
				html += '<a href="/admin/data/?model=' + input.model + '&record=' + key + '">' + key + '</a></li>';
			} else {
				list['key'] = key;
				html += row_template(list);
			}
		});

		html += '</ul>';

		html += '<a class="btn btn-primary" href="/admin/data/?model=' + input.model + '&record=create/">Create new</a></li>';

		return html;
	}

	this.deps = {'bootstrap': []};
}

widgets.model_type_selector = function(input, id) {
	/*this.children = function(callback) {
		var body = {};
		body['sel'] = {type: "field_text_select", label: 'Type'};
		body['sel']['choices'] = ['String', 'Boolean'];

		callback({body: body});
	}*/

	this.toHTML = function(slots, value) {
		//return slots['body'].html();
		var choices = ['String', 'Boolean', 'Date', 'RecordRef'];

		choices = choices.concat(Object.keys(cms.model_data['model']));

		var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : input.name) + ':' + '</label>';

	 	var html = label + '<select class="form-control" name="'+id+'">';
	 	html += '<option value=""> - Select - </option>';
	 	_.each(choices, function(choice) {
	 		html += '<option value="' +choice + '" '+ (input.data == choice ? 'selected': '') + '>' + choice + '</option>';
	 	});
	 	html += '</select>';
	 	return html;
	}
}

widgets.model_widget_selector = function(input, id) {
	this.toHTML = function(slots, value) {
		var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : input.name) + ':' + '</label>';

	 	var html = label + '<select class="form-control" name="'+id+'">';
	 	html += '<option value=""> - Select - </option>';
	 	_.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
      html += '<option value="' + w.name + '" '+ (input.data == w.name ? 'selected': '') + '>' + w.name + '</option>'
    });
	 	html += '</select>';
	 	return html;
	}
}


widgets.model_record_reference = function(input, id) {
	var model = 'user'

  this.deps = {'jquery': [],'select2': []};

  this.model = 'RecordRef';

	this.toHTML = function(slots, value) {
		var choices = [];

		choices = choices.concat(Object.keys(cms.model_data[model]));

		var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : input.name) + ':' + '</label>';

	 	var html = label + '<select class="sel form-control" name="'+id+'">';
	 	html += '<option value=""> - Select - </option>';
	 	_.each(choices, function(choice) {
	 		html += '<option value="' +choice + '" '+ (input.data == choice ? 'selected': '') + '>' + choice + '</option>';
	 	});
	 	html += '</select>';
	 	return html;
	}

  this.script = function() {
    return '$(".sel").select2();';
  }

}

widgets.widget_input_config = function(input, id) {
  this.deps = {'jquery': [],'bootstrap': [], 'font-awesome': ['css/font-awesome.css']};

	//this.head = ['<script src="/modules/models/widget-input.js" type="text/javascript"></script>'];

	this.processData = function(data) {
		if (!data)
			return data;
		console.log(data);
		return JSON.parse(data);
	}

	this.toHTML = function(slots, value) {
		var html = '';

		html += '<textarea style="display:none;" id="'+id+'-text" name="'+id+'"></textarea><a onclick="nw.configureWidget(this.id)" id="'+id+'"><i class="fa fa-cog fa-lg configure"></i></a>';

		return html;
	}

}