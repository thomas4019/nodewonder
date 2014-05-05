var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    Handlebars = require('handlebars'),
    deep = require('deep');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  init: function() {
  	cms.model_data['model'] = cms.model_data['model'] || {};
  	cms.models = cms.model_data['model'];
  },
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

widgets.model_form = {
	init: function() {
		cms.functions.loadModelIntoMemory('model');
		_.each(cms.model_data.model, function(list, key) {
			if (key != 'model') {
				cms.functions.loadModelIntoMemory(key);
			}
		});
	},
	settingsModel: [ {"name": "model", "type": "Text"},
    	//{"name": "fields", "type": "field", "quantity": "1+"},
    	{"name": "record", "type": "Text"},
    	{"name": "field", "type": "Text"},
    	{"name": "inline", "type": "Boolean"} ],
	deps: {'underscore': []},
	setup: function() {
		this.isSetup = true;

		if (!this.settings.field) {
			this.settings.field = 'fields';
		}

		if (this.settings.fields) {
			if (typeof this.settings.fields === 'string')
		 		this.fields = JSON.parse(this.settings.fields);
		 	else
		 		this.fields = this.settings.fields;
		} else if (this.settings.model) {
			if (!cms.model_data[this.settings.model]) {
				console.trace('Unknown model type: '+ this.settings.model);
			}
			if (!cms.model_data[this.settings.model][this.settings.record]) {
				console.trace('Unknown record: '+ this.settings.record);
			}
			this.fields = cms.model_data[this.settings.model][this.settings.record][this.settings.field];
		}

		if (typeof this.settings.data == 'string') {
			this.settings.data = JSON.parse(this.settings.data);
		}
	},
  getWidget: function(field, input) {
  	var default_widget = cms.functions.getDefaultWidget(field.type);

		var type = field.widget ? field.widget : default_widget;

  	if (type == 'model_form') {
  		input['model'] = 'model';
  		input['record'] = field.type;
  		input['inline'] = 'model';
  	}

  	if (field.quantity) {
  		input['quantity'] = field.quantity;
  		if (_.contains(cms.widgets[type].tags, 'field_edit_multiple')) {
  			//widget itself will do multiple
  		} else {
  			input['widget'] = type;
  			type = 'field_multi';
  		}
  	}

  	return type;
  },
  children: function(callback) {
		if (!this.isSetup)
			this.setup();

		var that = this;

		var model_values_obj = this.settings.data;
		if (!this.fields) {
			console.trace('missing fields');
			console.error(this.settings);
		}

	  var state = {"body": {}};
	  
	  _.each(this.fields, function(field, index) {
	  	if (field.type == '') {
	  		console.error('empty field');
	  		return;
	  	}

	  	var subdata = (model_values_obj) ? model_values_obj[field.name] : undefined;
	  	var input = _.extend(field.settings || {}, {label: field.name, data: subdata});

	  	var widget_type = that.getWidget(field, input);

	  	state["body"][field.name] = {type: widget_type, settings: input};
	  });

	  callback(state);
	},
	head: ['/modules/models/models.css'],
	processData: function(data, old) {
		var that = this;
		var out = {};

		_.each(this.fields, function(field) {
	  	if (field.type == '') {
	  		console.error('empty field');
	  		return;
	  	}

			var field_data = data[field.name];
			var field_old = old ? old[field.name] : undefined;

			var input = field.settings || {};
			var widget_type = that.getWidget(field, input);

			var widget = cms.functions.newWidget(widget_type, input);
			var processed = widget.processData(field_data, field_old);
			out[field.name] = processed;
		});

		return out;
	},
	validateData: function(data, callback) {
		if (!this.isSetup)
			this.setup();

		console.log('model processing data');
		var that = this;
		var errors = {};

		var total = Object.keys(this.fields).length;
		var count = 0;

		_.each(this.fields, function(field) {
	  	if (field.type == '') {
	  		console.error('empty field');
	  		return;
	  	}

			var field_data = data[field.name];
			var input = field.settings || {};
			var widget_type = that.getWidget(field, input);

			function handle(error) {
				count++;
				if (error)
					errors[field.name] = error;
				if (count == total)
					callback(errors);
			}

			var widget = cms.functions.newWidget(widget_type, input);
			if (widget.validateData.length == 2) { //async
				widget.validateData(field_data, handle);
			} else { //sync
				var error = widget.validateData(field_data);
				handle(error);
			}
		});
  },
  wrapperClass: function() {
		if (this.settings.inline)
			return 'inline-model-form';
		else
			return '';
	},
	script: function() {
		return 'nw.model["'+this.id+'"] = '+JSON.stringify({"fields": this.fields})+';';
	},
	toHTML: function() {
		return this.renderSlot('body');
	}
}

widgets.model_record_view = {
	settingsModel: [{"name": "model", "type": "RecordRef", "settings": {"model": "model"}},
		{"name": "record", "type": "Text"},
		{"name": "view", "type": "Text"}],
	children: function(callback) {
		cms.functions.getRecord(settings.model, settings.record, function(err, data) {
			var record = data;
			cms.functions.getRecord('model', settings.model, function(err, data2) {
				var model = data2;
				var model_view;
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
	},
	toHTML: function() {
		return this.renderSlot('body');
	}
}

widgets.model_data_listing = {
	settingsModel: [{"name": "row_template", "type": "Text", "widget": "textarea"}, 
			{"name": "model", "type": "Text"},
			{"name": "manual_list", "type": "Boolean"},
			{"name": "add_button", "type": "Boolean"}],
	settings_unfiltered: ['row_template'],
	deps: {'jquery': [],'bootstrap': []},
	toHTML: function() {
		var row_template;
		if (this.settings.row_template) {
			row_template = Handlebars.compile(this.settings.row_template);
		}

		var html = '';

		html += '<h1>'
		+ (this.settings.title ? this.settings.title : ('<a href="/admin/list/model">Models</a> : ' + this.settings.model))
		+ '</h1>';

		if (!this.settings.manual_list) {
			html  += '<ul class="list-group">'
		}

		var data = cms.model_data[this.settings.model];
		for (key in data) {
			var list = data[key];
			if (!this.settings.manual_list) {
				html += '<li class="list-group-item" >';
			}
			if (!this.settings.row_template) {
				html += '<a href="/admin/data/?model=' + this.settings.model + '&record=' + key + '">' + key + '</a>';
			} else {
				list['key'] = key;
				html += row_template(list);
			}
			if (!this.settings.manual_list) {
				html += '</li>';
			}
		}

		if (!this.settings.manual_list) {
			html += '</ul>';
		}

		if (this.settings.add_button) {
			html += '<a class="btn btn-primary" href="/admin/data/?model=' + this.settings.model + '&record=create">Create new</a></li>';
		}

		return html;
	}
}

widgets.model_type_selector = {
	head: function() {
		return ['<script type="text/javascript">nw.edit_widgets='+JSON.stringify(cms.edit_widgets)+';</script>', 
	'/modules/models/field.js']
	},
	script: function() {
		return 'model_field_type_setup("'+this.id+'"); $("#' + this.id + ' select").on("change", function() {model_field_type_setup("'+this.id+'"); });';
	},
	toHTML: function(label) {
		var data = this.settings.data;
		var choices = Object.keys(cms.model_widgets);

		choices = choices.concat(Object.keys(cms.model_data['model']));

	 	var html = label + '<select class="form-control" name="'+this.id+'">';
	 	html += '<option value=""> - Select - </option>';
	 	_.each(choices, function(choice) {
	 		html += '<option value="' +choice + '" '+ (data == choice ? 'selected': '') + '>' + choice + '</option>';
	 	});
	 	html += '</select>';
	 	return html;
	}
}

widgets.model_widget_selector = {
	toHTML: function(label) {
		var data = this.settings.data;
		var that = this;
	 	var html = label + '<select class="form-control" name="'+this.id+'">';
	 	html += '<option value=""> - Select - </option>';
	 	_.each(cms.widgets, function(w) {
      html += '<option value="' + w.name + '" '+ (data == w.name ? ' selected="selected" ': '') + '>' + w.name + '</option>'
    });
	 	html += '</select>';
	 	return html;
	}
}

widgets.model_record_reference = {
  deps: {'jquery': [],'select2': []},
  tags: ['field_edit', 'field_edit_multiple'],
  settingsModel: [ {"name": "label", "type": "Text"},
  		{"name": "model", "type": "Record", "settings": {"model": "model"} },
  		{"name": "data", "type": "Record"} ],
  processData: function(data) {
  	if ( this.settings.quantity) {
  		if (!data) {
  			return [];
  		}
  		if (typeof data == 'string')
  			return [data];
  		return data;
  	}
  	return data;
  },
	toHTML: function(label) {
		var data = this.settings.data;
		var choices = [];
		choices = choices.concat(Object.keys(cms.model_data[this.settings.model]));

	 	var html = label + '<select class="sel" ' + (this.settings.quantity ? 'multiple' : '') + ' style="width: 100%;height: 34px;" name="'+this.id+'">';
	 	if (!this.settings.quantity) {
	 		html += '<option value=""> - Select - </option>';
	 	}
	 	if (this.settings.quantity) {	
	 		_.each(choices, function(choice) {
		 		html += '<option value="' +choice + '" '+ (_.contains(data, choice) ? 'selected': '') + '>' + choice + '</option>';
		 	});
	 	} else {
		 	_.each(choices, function(choice) {
		 		html += '<option value="' +choice + '" '+ (data == choice ? 'selected': '') + '>' + choice + '</option>';
		 	});
		 }
	 	html += '</select>';
	 	return html;
	},
  script: function() {
    return '$("#'+this.id+' .sel").select2();';
  }
}

widgets.widget_input_config = {
  head: ['/modules/admin/state-utils.js', '/modules/admin/state-editor.css'],
  deps: {'jquery': [],'bootstrap': [], 'font-awesome': ['css/font-awesome.css'], 'underscore': []},
	head: ['/modules/models/widget_config.js'],
	processData: function(data) {
		if (!data)
			return data;
		return JSON.parse(data);
	},
	toHTML: function(label) {
		var html = '';

		html += '<textarea style="display:none;" id="'+this.id+'-text" name="'+this.id+'">' +
		(this.settings.data ? JSON.stringify(this.settings.data) : '')+'</textarea>' +
		'<a onclick="configureModelWidget(this.id);" id="'+this.id+'"><i class="fa fa-cog fa-lg configure"></i></a>';

		return html;
	}
}

widgets.widget_settings_model = {
	wrapper: 'none',
	toHTML: function() {
		var type = cms.widgets[this.settings.widget_type];
		var settings_model = type.settingsModel ? retreive(type.settingsModel) : [];

		return JSON.stringify(settings_model);
	}
}

widgets.process_model = {
	settingsModel: [{"name":"model", "type": "Text"},
		{"name":"data", "type":"JSON"}],
	wrapper: 'none',
	load: function(callback) {
		var model_widget = cms.functions.newWidget('model_form', {'fields': this.settings.fields});
		var old = {};
		var user = {};
		user.clientID = 'unknownID';
		user.ip = '0.0.0.0';

		this.processed = model_widget.processData(this.settings.data, old);
		model_widget.validateData(this.processed, function(c_errors) {
			console.log('validation finished');
			this.errors = c_errors;
			callback();
		});
	},
	toHTML: function() {
		return JSON.stringify({validationErrors: this.errors, data: this.processed});
	}
}

widgets.delete_record = {
  settingsModel: [{"name": "model", "type": "Text"},
    {"name": "record", "type": "Text"}],
  slots: ['success', 'failure'],
  tags: ['filtered'],
  slot_tags: {success: ['action'], failure: ['action']},
  setup: function() {
    cms.functions.setupProcess('delete_record', this.settings);
  },
  action: function(settings, id, scope, handlers) {
    nw.functions.doProcess(settings.token, {}, handlers.success, handlers.failure);
  },
	doProcess: function(input, callback) {
    cms.functions.deleteRecord(this.settings.model, this.settings.record, function(err) {
      callback(err, {});
    });
  }
}

widgets.get_form_data = {
  settingsModel: [{"name": "selector", "type": "Text"},
    {"name": "dest", "type": "Text"}],
  action: function(settings, id, scope, handlers) {
    var id = settings.selector ? settings.selector.substr(1) : '';
    var model = nw.model[id];
    var data = nw.functions.expandPostValues(nw.functions.serializedArrayToValues($('#'+id+' :input').serializeArray()));
    scope[settings.dest] = data;
    console.log(scope);
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
  setup: function() {
    cms.functions.setupProcess('save_record', this.settings);
  },
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

		cms.functions.getRecord('model', settings.model, function(err, model) {
			var record = settings.record;
			
			cms.functions.getRecord(settings.model, record, function(err, 	old_data) {
				var model_widget = cms.functions.newWidget('model_form', {model: 'model', record: settings.model});
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