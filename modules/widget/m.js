var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets,
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
  return '<div class="field row ' + (error !== '' ? 'has-error' : '')  + '">' + label + widget + '</div>';
}

var widget_selector = function() {
	function toHTML() {

	}
}

var two_col = function(col1, col2) {
	this.col1 = col1 || 6;
	this.col2 = col2 || 6;

	this.input = [
			{type : 'number', name : 'col1'},
			{type : 'number', name : 'col2'},
	];

	this.toHTML = function(zones) {
		return '<div class="row"><div class="col-sm-' + this.col1 + '">' + zones['left'] + 
			'</div><div class="col-sm-' + this.col2 + '">' + zones['right'] + '</div></div>';
	}
};
two_col.prototype.name = 'two_col';

var widget_settings = function(input) {
	var name = input.name;

	this.head = function() {
		return '<link href="/modules/widget/widget.css" rel="stylesheet">';
	}

  this.toHTML = function() {
    var form = {};

    form['text'] = fields.string(_.extend(bootstrap_settings,{value : '', label : ''}));
    form['quantity'] = fields.string(_.extend(bootstrap_settings,{value : '', label : ''}));
    form['hierarchy'] = fields.boolean(_.extend(bootstrap_settings,{value : '', label : ''}));

    var form_html = forms.create(form).toHTML(bootstrap_f);
    var configure_gear = '<div class="configure"><span class="glyphicon glyphicon-cog"></span></div>';
    
    return '<div class="well">' +
    '<h4>' + name + '</h4>'
     + configure_gear + form_html + '</div>';
  }
}
widget_settings.prototype.name = 'widget_settings';

module.exports = {
	widgets : [two_col, widget_selector, widget_settings],
}