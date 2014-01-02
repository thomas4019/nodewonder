var forms = require('forms'), fields = forms.fields, validators = forms.validators, fwidgets = forms.widgets, fs = require('fs'), _ = require('underscore');

module.exports = {
	widgets : {}
};
widgets = module.exports.widgets;

var bootstrap_field = function(name, object) {
	var label = object.labelHTML(name);
	var error = object.error ? '<p class="form-error-tooltip">' + object.error
			+ '</p>' : '';
	var widget = '<div class="controls col col-lg-9">'
			+ object.widget.toHTML(name, object) + error + '</div>';
	return '<div class="field row control-group '
			+ (error !== '' ? 'has-error' : '') + '">' + label + widget + '</div>';
}

widgets.setting = function(input) {
	var data;
	var name = input.file;
	var file = 'settings/' + name + '.json'

	this.load = function(callback) {
		fs.readFile(file, 'utf8', function(err, file_data) {
			if (err) {
				return console.log(err);
			}
			data = JSON.parse(file_data);
			callback();
		});
	}

	this.save = function(post) {
		var out = {};
		_.each(data, function(config, key) {
			switch (config.t) {
			case 'boolean':
				config['v'] = (post[key]) ? true : false;
				out[key] = config;
				break;
			default:
				config['v'] = post[key];
				out[key] = config;
				break;
			}
		});
		fs.writeFile(file, JSON.stringify(out));
	}

	this.deps = function() {
		return {
			'jquery-form' : {}
		};
	}

	this.toHTML = function() {
		var form = {};

		var settings = {
			errorAfterField : true,
			cssClasses : {
				label : [ 'control-label col col-lg-3' ]
			}
		};

		for ( var k in data) {
			if (k != 'id' && k != '_id') {
				var json_type = typeof data[k];
				var type = data[k]['t'];
				var readable_name = data[k]['n'];
				var v = data[k]['v'];
				switch (type) {
				case 'string':
					form[k] = fields.string(_.extend(settings, {
						value : v,
						label : readable_name
					}));
					break;
				case 'boolean':
					form[k] = fields.boolean(_.extend(settings, {
						value : v,
						label : readable_name
					}));
					break;
				case 'number':
					form[k] = fields.number(_.extend(settings, {
						value : v,
						label : readable_name
					}));
					break;
				case 'email':
					form[k] = fields.email(_.extend(settings, {
						value : v,
						label : readable_name
					}));
					break
				case 'longtext':
					form[k] = fields.string(_.extend(settings, {
						value : v,
						label : readable_name,
						widget : fwidgets.textarea()
					}));
					break;
				}
			}
		}

		form['form'] = fields.string({
			value : name,
			widget : fwidgets.hidden({
				value : name
			})
		});

		var reg_form = forms.create(form);

		// var form_html = reg_form.toHTML();
		var form_html = reg_form.toHTML(function(name, object) {
			return bootstrap_field(name, object);
		});
		var tabs = '<ul class="nav nav-tabs" data-tabs="tabs"><li><a href="#html" data-toggle="tab">HTML</a></li><li><a href="#json" data-toggle="tab">JSON</a></li></ul>';

		var htmlTab = '<div class="tab-pane" id="html"><div class="form-group">'
				+ form_html
				+ '<button type="submit" class="btn btn-primary">Submit</button></div></div>';
		var jsonTab = '<div class="tab-pane" id="json"><textarea class="form-control boxsizingBorder json">'
				+ JSON.stringify(data) + '</textarea></div>';

		html = tabs
				+ '<form role="form" action="/post" method="post" class="well"><div id="my-tab-content" class="tab-content">'
				+ htmlTab + jsonTab + '</div></div></form>';
		html += '<script type="text/javascript">jQuery(document).ready(function ($) {$(\'.nav-tabs\').tab();$(\'.nav-tabs a:first\').tab(\'show\');});var options = {success: function() {  }, error : function() {alert("Error");} }; $(\'form\').ajaxForm(options); </script>';

		return html;
	}
}

widgets.hello_world = function() {
	this.toHTML = function() {
		return 'Hello World';
	}
}