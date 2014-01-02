var forms = require('forms'),
    fields = forms.fields,
    fvalidators = forms.validators,
    fwidgets = forms.widgets,
    fs = require('fs'),
    _ = require('underscore');

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

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

widgets.field_boolean = function (input, id) {
	var name = input.name;
	var label = input.label;
	var value = input.value || false;

  this.toHTML = function() {
    var form = {};

    form[id] = fields.boolean(_.extend(bootstrap_settings,{value : value, label : label}));

    var form_html = forms.create(form).toHTML(bootstrap_f);
    
    return form_html;
  }
}

widgets.field_text = function (input, id) {
	var name = input.name;
	var label = input.label;
	var value = input.value || '';
  //console.log(input);

  this.toHTML = function(zones, value) {
    var form = {};

    form[id] = fields.string(_.extend(bootstrap_settings,{value : (value || input.value), label : label}));
    var form_html = forms.create(form).toHTML(bootstrap_f);
    return form_html;

    //return '<input type="text" name="' + name + '" value="' + (value || input.value) + '" />';
  }
}

widgets.field_text_select = function (input) {
	var name = input.name;
	var label = input.label;
	var value = input.value || '';
	var choices = input.choices || ['a', 'b', 'c'];

  this.toHTML = function() {
    var form = {};
    form['text'] = fields.string(_.extend(bootstrap_settings,{value : value, choices : choices, label : label, widget:fwidgets.select()}));

    var form_html = forms.create(form).toHTML(bootstrap_f);

    return form_html;
  }
}

widgets.submit = function (input) {
  var label = input.label;

  this.toHTML = function() {
    return '<input type="submit" class="btn btn-primary" value="' + label + '" />'
  }
}

widgets.field_date = function (input) {
	var name = input.name;
	var label = input.label;
	var value = input.value || '';

	this.head = function() {
		return '<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/" rel="stylesheet">';
	}

  this.deps = function() {
    return {'jquery-ui': ['themes/smoothness/jquery-ui.min.css'] }
  }

	this.toHTML = function() {
		var form = {};

    form['text'] = fields.string(_.extend(bootstrap_settings,{value : value, label : label}));

    var form_html = forms.create(form).toHTML(bootstrap_f);
    
    return form_html;
	}

	this.script = function(container_id) {
		return '$("#' + container_id + ' input").datepicker();';
	}
}


widgets.itext = function (input, id) {
  this.input = function() {
    return  {
      "value:field_text" : {"label" : "Text", "value" : input.value}
    };
  }

  this.isPage = function () {
    return true;
  }

  this.toHTML = function(zones, value) {
    return input.value;
  }
}

widgets.test = function (input, id) {
  this.deps = function() {
    return {'dynatree' : {}, 'jquery-ui': {} }
  }

  this.head = function() {
    return '<script src="/modules/forms/data.js" type="text/javascript"></script>';
  }

  this.script = function() {
    return 'console.log(data); $("#tree").dynatree({children : data, dnd : dnd2});';
  }

  this.toHTML = function(zones, value) {
    return '<div id="tree"></div>';
  }
}
