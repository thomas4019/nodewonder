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
	mkdirp('data/' + model_name + '/' + path.dirname(record_id));
	fs.writeFile('data/' + model_name + '/' + record_id  + '.json', JSON.stringify(value, null, 4))	;
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
			if (value == 'new Object') {
				value = {};
				//tocheck.push(last);
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

widgets.model_form = function(settings, id, user) {
	var fields;

	var inline = settings.inline;

	if (!settings.field) {
		settings.field = 'fields';
	}

	if (settings.fields) {
		if (typeof settings.fields === 'string')
	 		fields = JSON.parse(settings.fields);
	 	else
	 		fields = settings.fields;
	} else if (settings.model) {
		if (!cms.model_data[settings.model]) {
			console.trace('Unknown model type: '+ settings.model);
		}
		if (!cms.model_data[settings.model][settings.record]) {
			console.trace('Unknown record: '+ settings.record);
		}
		fields = cms.model_data[settings.model][settings.record][settings.field];
	}

	if (typeof settings.data == 'string') {
		settings.data = JSON.parse(settings.data);
	}

	this.deps = {'underscore': []};

  this.settings = function() {
    return  [ {"name": "model", "type": "Text"},
    	//{"name": "fields", "type": "field", "quantity": "1+"},
    	{"name": "record", "type": "Text"},
    	{"name": "field", "type": "Text"},
    	{"name": "inline", "type": "Boolean"} ];
  }

  function getWidget(field, input) {
  	var default_widget = cms.functions.getDefaultWidget(field.type);

		var type = field.widget ? field.widget : default_widget;

  	if (type == 'model_form') {
  		input[	'model'] = 'model';
  		input['record'] = field.type;
  		input['inline'] = 'model';
  	}

  	if (field.quantity) {
  		input['widget'] = type;
  		type = 'field_multi';
  		input['quantity'] = field.quantity;
  	}

  	return type;
  }

	this.children = function(callback) {
		var model_values_obj = settings.data;
		if (!fields) {
			console.trace('missing fields');
			console.error(settings);
		}

	  var state = {"body": {}};
	  
	  _.each(fields, function(field, index) {
	  	var subdata = (model_values_obj) ? model_values_obj[field.name] : undefined;
	  	var input = _.extend(field.settings || {}, {label: field.name, data: subdata});

	  	var widget_type = getWidget(field, input);

	  	state["body"][field.name] = {type: widget_type, settings: input};
	  });

	  callback(state);
	}

	this.head = ['/modules/models/models.css'];

	this.processData = function(data, old) {
		console.log('model processing data');
		var out = {};

		_.each(fields, function(field) {
			var field_data = data[field.name];
			var field_old = old ? old[field.name] : undefined;

			var input = field.settings || {};
			var widget_type = getWidget(field, input);

			var widget = new cms.widgets[widget_type](input);
			var processed = widget.processData(field_data, field_old, user);
			out[field.name] = processed;
		});

		return out;
	}

	this.validateData = function(data, callback) {
		console.log('model processing data');
		var errors = {};

		var total = Object.keys(fields).length;
		var count = 0;

		_.each(fields, function(field) {
			var field_data = data[field.name];
			var input = field.settings || {};
			var widget_type = getWidget(field, input);

			function handle(error) {
				count++;
				if (error)
					errors[field.name] = error;
				if (count == total)
					callback(errors);
			}

			var widget = new cms.widgets[widget_type](input);
			if (widget.validateData.length == 2) { //async
				widget.validateData(field_data, handle);
			} else { //sync
				var error = widget.validateData(field_data);
				handle(error);
			}
		});
  }

	this.wrapper_class = function() {
		if (inline)
			return 'inline-model-form';
		else
			return '';
	}

	this.script = function() {
		return 'nw.model["'+id+'"] = '+JSON.stringify({"fields": fields})+';';
	}

	this.toHTML = function(slots) {
		return slots.body.html();
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

widgets.model_data_listing = function(settings) {
	this.settings = function() {
		return [{"name": "row_template", "type": "Text", "widget": "textarea"}, 
			{"name": "model", "type": "Text"},
			{"name": "manual_list", "type": "Boolean"},
			{"name": "add_button", "type": "Boolean"}]
	}

	this.toHTML = function() {

		var row_template;
		if (settings.row_template) {
			row_template = Handlebars.compile(settings.row_template);
		}

		var html = '';

		html += '<h1>'
		+ (settings.title ? settings.title : ('<a href="/admin/list/model">Models</a> : ' + settings.model))
		+ '</h1>';

		if (!settings.manual_list) {
			html  += '<ul class="list-group">'
		}

		var data = cms.model_data[settings.model];
		_.each(data, function(list, key) {
			if (!settings.manual_list) {
				html += '<li class="list-group-item" >';
			}
			if (!settings.row_template) {
				html += '<a href="/admin/data/?model=' + settings.model + '&record=' + key + '">' + key + '</a>';
			} else {
				list['key'] = key;
				html += row_template(list);
			}
			if (!settings.manual_list) {
				html += '</li>';
			}
		});

		if (!settings.manual_list) {
			html += '</ul>';
		}

		if (settings.add_button) {
			html += '<a class="btn btn-primary" href="/admin/data/?model=' + settings.model + '&record=create">Create new</a></li>';
		}

		return html;
	}

	this.deps = {'jquery': [],'bootstrap': []};
}
widgets.model_data_listing.settings_unfiltered = ['row_template'];

widgets.model_type_selector = function(input, id) {
	this.head = ['<script type="text/javascript">nw.edit_widgets='+JSON.stringify(cms.edit_widgets)+';</script>', 
	'/modules/models/field.js'];

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
		var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : '') + ':' + '</label>';

	 	var html = label + '<select class="form-control" name="'+id+'">';
	 	html += '<option value=""> - Select - </option>';
	 	_.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
      html += '<option value="' + w.name + '" '+ (input.data == w.name ? ' selected="selected" ': '') + '>' + w.name + '</option>'
    });
	 	html += '</select>';
	 	return html;
	}
}


widgets.model_record_reference = function(input, id) {
	var model = input.model || 'user';

  this.deps = {'jquery': [],'select2': []};

  this.tags = ['field_edit'];

  this.settings = function() {
  	return [ {"name": "label", "type": "Text"},
  		{"name": "model", "type": "Record", "settings": {"model": "model"} },
  		{"name": "data", "type": "Record"} ]
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
  this.head = ['/modules/admin/state-utils.js',
    '/modules/admin/state-editor.css'];

  this.deps = {'jquery': [],'bootstrap': [], 'font-awesome': ['css/font-awesome.css'], 'underscore': []};

	this.head = ['/modules/models/widget_config.js'];

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

widgets.process_model = function(settings, id) {
	this.settings = [{"name":"model", "type": "Text"},
		{"name":"data", "type":"JSON"}];

	this.wrapper = 'none';

	var errors;
	var processed;

	this.load = function(callback) {
		var model_widget = new cms.widgets['model_form']({'fields': settings.fields});
		var old = {};
		var user = {};
		user.clientID = 'unknownID';
		user.ip = '0.0.0.0';

		processed = model_widget.processData(settings.data, old, user);
		model_widget.validateData(processed, function(c_errors) {
			console.log('validation finished');
			errors = c_errors;
			callback();
		});
	}

	this.toHTML = function() {
		return JSON.stringify({validationErrors: errors, data: processed});
	}
}

widgets.delete_record = function(settings, id, scope) {
  this.settings = [{"name": "model", "type": "Text"},
    {"name": "record", "type": "Text"}];

  this.zones = ['success', 'failure'];
  this.zone_tags = {success: ['action'], failure: ['action']};

  /*this.makeActionJS = function() {
    var token = cms.functions.makeid(36);

    cms.pending_processes[token] = {
      process: 'delete_record',
      settings: settings,
      token: token
    };

    var slots = this.all_children;
    var success = cms.functions.createActionCode(slots.success);
    var failure = cms.functions.createActionCode(slots.failure);

    return 'nw.functions.doProcess("'+token+'", function() { '+ success +' }, function() { '+ failure +' });';
  }*/

  if (id) {
    cms.functions.setupProcess('delete_record', settings);
  }

  this.action = function(settings, id, scope, handlers) {
    nw.functions.doProcess(settings.token, {}, handlers.success, handlers.failure);
  }

  this.doProcess = function(input, callback) {
    cms.functions.deleteRecord(settings.model, settings.record, function(err) {
      callback(err, {});
    });
  }
}

widgets.get_form_data = function(settings, id) {
  this.settings = [{"name": "selector", "type": "Text"},
    {"name": "dest", "type": "Text"}];

  this.action = function(settings, id, scope, handlers) {
    var id = settings.selector ? settings.selector.substr(1) : '';
    var model = nw.model[id];
    var data = nw.functions.expandPostValues(nw.functions.serializedArrayToValues($('#'+id+' :input').serializeArray()));
    scope[settings.dest] = data;
    console.log(scope);
  }
}

widgets.save_record = function(settings, id, user) {
  this.settings = [{"name": "model", "type": "Text"},
    {"name": "record", "type": "Text"},
    {"name": "data_name", "type": "Text"},
    {"name": "data", "type": "JSON"},
    {"name": "record_id_dest", "type": "Text"}];

  this.zones = ['success', 'failure'];
  this.zone_tags = {success: ['action'], failure: ['action']};

  if (id) {
    cms.functions.setupProcess('save_record', settings);
  }

  this.action = function(settings, id, scope, handlers) {
    var data = scope[settings.data_name];
    nw.functions.doProcess(settings.token, {data: data}, function(result) {
    	if (settings.record_id_dest) {
    		scope[settings.record_id_dest] = result.record;
    	}
    	handlers.success();
    }, handlers.failure);
  }

	this.doProcess = function (input, callback) {
		var widget = this;
		console.log(settings);
		console.log(input.data);

		cms.functions.getRecord('model', settings.model, function(err, model) {
			var record = settings.record;
			
			cms.functions.getRecord(settings.model, record, function(err, 	old_data) {
				var model_widget = new cms.widgets['model_form']({model: 'model', record: settings.model}, '', user);
				var processed = model_widget.processData(input.data, old_data);

				if (settings.record == 'create') {
					if (model.index && processed[model.index])
						record = processed[model.index];
					else
						record = cms.functions.generateRecordID();
				}

				cms.functions.saveRecord(settings.model, record, processed, function(err, records) {
					callback(err, {record: record});
				});
			});
		});
	}
}