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

function retreive(val) {
  return (typeof val == 'function') ? val() : val;
}

functions.generateRecordID = function() {
	return cms.functions.makeid(16);
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
	mkdirp('data/' + model_name + '/');
	fs.writeFile('data/' + model_name + '/' + record_id  + '.json', JSON.stringify(value, null, 4));
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

		if (value == '{}')
			return false;

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
		if (!model) {
			console.error('Unknown model type: '+ input.model);
		}
	} else if (input.fields) {
	 	model = {"fields": JSON.parse(input.fields) };
	}

	if (input.values) {
		input.data = JSON.parse(input.values);
	}

  this.settings = function() {
    return  [ {"name": "model", "type": "Text"},
    	//{"name": "fields", "type": "field", "quantity": "1+"},
    	{"name": "inline", "type": "Boolean"},
    	{"name": "record", "type": "Text"} ];
  }

	this.children = function(callback) {
		if (!inline && input.record && input.record != 'create') {
			//console.log('loadingi data: ' + input.model + '/' + input.record);
			cms.functions.getRecord(input.model, input.record, function(err, data2) {
				if (err) {
					console.error(err);
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
		  var state = {"body": {}};
		  var index = 0;
		  
		  if (!model) {
		  	console.error("model error");
		  	console.error(input);
		  }
		  _.each(model.fields, function(field, index) {
		  	var subdata = (model_values_obj) ? model_values_obj[field.name] : undefined;
		  	var default_widget = cms.functions.getDefaultWidget(field.type);

	  		var input = _.extend(field.settings || {}, {name: field.name, data: subdata});
	  		var type = field.widget ? field.widget : default_widget;

		  	if (type == 'model_form') {
		  		input['model'] = field.type;
		  		input['inline'] = 'model';
		  	}

		  	if (field.quantity) {
		  		input['widget'] = type;
		  		type = 'field_multi';
		  		input['quantity'] = field.quantity;
		  	}

		  	state["body"][field.name] = {type: type, settings: input};
		  });

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
			if (widget_name == 'model_form') {
				input['model'] = field.type;
				input['inline'] = 'model';
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

	this.save = function (values, callback) {

		var data = cms.functions.expandPostValues(values);
		var related = cms.pending_forms[data.form_token];
		delete data['form_token'];
		model = related.model;
		var processed = this.processData(data);

		var record = related.record;
		if (related.record == 'create') {
			if (related.model.key && processed[related.model.key])
				record = processed[related.model.key];
			else
				record = cms.functions.generateRecordID();
		}
		console.log(processed);
		cms.functions.saveRecord(related.collection, record, processed, function(err, records) {
			callback(err, records);
		});
	}

	this.wrapper_class = function() {
		if (inline)
			return 'inline-model-form';
		else
			return '';
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
			return cms.functions.wrapInForm( slots.body.html(), 'model_form',  values);
			//return cms.functions.wrapInForm( slots.body.html(), 'model_form', {model: input.model, record: input.record} );
		}
	}
}
widgets.model_form.init = function() {
	cms.functions.loadModelIntoMemory('model');
	_.each(cms.model_data.model, function(list, key) {
		if (key != 'model') {
			cms.functions.loadModelIntoMemory(key);
		}
	});
}

widgets.model_record_view = function(settings, id) {
	this.settings = function() {
		return [{"name": "model", "type": "RecordRef", "settings": {"model": "model"}},
		{"name": "record", "type": "Text"},
		{"name": "view", "type": "Text"}];
	}

	var record;
	var model;
	var model_view;

	this.children = function(callback) {
		cms.functions.getRecord(settings.model, settings.record, function(err, data) {
			record = data;
			cms.functions.getRecord('model', settings.model, function(err, data2) {
				model = data2;
				_.each(model.views, function(view) {
					if (view.Name == settings.view) {
						model_view = view;
					}
				});
				_.each(model_view.Code.widgets, function(widget) {
					if (widget.model && widget.field) {
						widget.settings = widget.settings || {};
						widget.settings.data = record[widget.field];
					}
				});
				callback({'body': model_view.Code.widgets}, model_view.Code.slotAssignments);
			});
		});
	}

	this.toHTML = function(slots) {
		return slots.body.html();
	}
}

widgets.model_data_listing = function(input) {
	this.settings = function() {
		return [{"name": "row_template", "type": "Text", "widget": "textarea"}, 
			{"name": "model", "type": "Text"},
			{"name": "add_button", "type": "Boolean"}]
	}

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

		if (input.add_button) {
			html += '<a class="btn btn-primary" href="/admin/data/?model=' + input.model + '&record=create">Create new</a></li>';
		}

		return html;
	}

	this.deps = {'jquery': [],'bootstrap': []};
}

widgets.model_type_selector = function(input, id) {
	this.head = ['<script type="text/javascript">edit_widgets='+JSON.stringify(cms.edit_widgets)+';</script>', 
	'<script type="text/javascript" src="/modules/models/field.js"></script>'];

	this.script = function() {
		return 'model_field_type_setup("'+id+'"); $("#' + id + ' select").on("change", function() {model_field_type_setup("'+id+'"); });';
	}

	this.toHTML = function(slots, value) {
		//return slots['body'].html();
		var choices = Object.keys(cms.model_widgets);

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
	var model = input.model || 'user';

  this.deps = {'jquery': [],'select2': []};

  this.model = 'RecordRef';

  this.settings = function() {
  	return [ {"name": "label", "type": "Text"},
  		{"name": "model", "type": "RecordRef", "settings": {"model": "model"} } ]
  }

	this.toHTML = function(slots, value) {
		var choices = [];

		choices = choices.concat(Object.keys(cms.model_data[model]));

		var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : input.name) + ':' + '</label>';

	 	var html = label + '<select class="sel" style="width: 100%;height: 34px;" name="'+id+'">';
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
  this.head = ['<script src="/modules/admin/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/admin/state-editor.css" />'];

  this.deps = {'jquery': [],'bootstrap': [], 'font-awesome': ['css/font-awesome.css'], 'underscore': []};

	this.head = ['<script src="/modules/models/widget_config.js" type="text/javascript"></script>'];

	this.processData = function(data) {
		if (!data)
			return data;
		return JSON.parse(data);
	}

	this.toHTML = function(slots, value) {
		var html = '';

		html += '<textarea style="display:none;" id="'+id+'-text" name="'+id+'">'+(input.data ? JSON.stringify(input.data) : '')+'</textarea><a onclick="configureModelWidget(this.id);" id="'+id+'"><i class="fa fa-cog fa-lg configure"></i></a>';

		return html;
	}

}

widgets.widget_settings_model = function(settings, id) {
	this.wrapper = 'none';

	this.toHTML = function() {
		var w = new cms.widgets[settings.widget_type]({}, '');
		var settings_model = w.settings ? retreive(w.settings) : [];

		return JSON.stringify(settings_model);
	}
}