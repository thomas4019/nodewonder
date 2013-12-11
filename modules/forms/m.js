var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets,
    fs = require('fs'),
    _ = require('underscore');

var bootstrap_settings = {
  errorAfterField: true,
  cssClasses: {
      label: ['control-label']
  }};

var bootstrap_f = function (name, object) {
	return bootstrap_field(name, object);
}

var bootstrap_field = function (name, object) {
  var label = object.labelHTML(name);
  var error = object.error ? '<p class="form-error-tooltip">' + object.error + '</p>' : '';
  var widget = '<div class="controls">' + object.widget.toHTML(name, object) + error + '</div>';
  return '<div class="field row control-group ' + (error !== '' ? 'has-error' : '')  + '">' + label + widget + '</div>';
}

var field_boolean = function (input) {
	var name = input.name;
	var label = input.label;
	var value = input.value || false;

  this.toHTML = function() {
    var form = {};

    form['text'] = fields.boolean(_.extend(bootstrap_settings,{value : value, label : label}));

    var form_html = forms.create(form).toHTML(bootstrap_f);
    
    return form_html;
  }
}
field_boolean.prototype.name = 'field_boolean';

var field_text = function (input) {
	var name = input.name;
	var label = input.label;
	var value = input.value || '';

  this.toHTML = function() {


    var form = {};

    form['text'] = fields.string(_.extend(bootstrap_settings,{value : value, label : label}));

    var form_html = forms.create(form).toHTML(bootstrap_f);
    
    return form_html;
  }
}
field_text.prototype.name = 'field_text';

var field_text_select = function (input) {
	var name = input.name;
	var label = input.label;
	var value = input.value || '';
	var choices = input.choices || ['a', 'b', 'c'];

  this.toHTML = function() {
    var form = {};

    form['text'] = fields.string(_.extend(bootstrap_settings,{value : value, choices : choices, label : label, widget:widgets.select()}));

    var form_html = forms.create(form).toHTML(bootstrap_f);

    return form_html;
  }
}
field_text_select.prototype.name = 'field_text_select';

var field_date = function (input) {
	var name = input.name;
	var label = input.label;
	var value = input.value || '';

	this.head = function() {
		return '<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>' +
		'<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/themes/smoothness/jquery-ui.min.css" rel="stylesheet">';
	}

	this.toHTML = function() {
		var form = {};

    form['text'] = fields.string(_.extend(bootstrap_settings,{value : value, label : label}));

    var form_html = forms.create(form).toHTML(bootstrap_f);
    
    return form_html;
	}

	this.onReady = function(container_id) {
		return '$("#' + container_id + ' input").datepicker();';
	}
}
field_date.prototype.name = 'field_date';



module.exports = {
	widgets : [field_boolean, field_text, field_text_select, field_date],
}