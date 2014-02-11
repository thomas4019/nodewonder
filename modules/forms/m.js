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
  return '<div class="field control-group ' + (error !== '' ? 'has-error' : '')  + '">' + label + widget + '</div>';
}

widgets.field_boolean = function (input, id) {
  var name = input.name;
  var label = input.label;
  var value = input.value || false;

  this.toHTML = function() {
    var form_html = '<label for="' + name + '" >' + label + '</label>' + '<input type="checkbox" name="' + name + '" >'
    
    return form_html;
  }
}

widgets.form = function (input, id) {
  this.toHTML = function(zones, value) {
    var html = '<form action="/post" method="post">'

    if (input.widget) {
      html += '<input type="hidden" name="widget" value="' + input.widget + '" />';
    }

    html += zones['form'];
    html += '</form>';
    return html;
  }
}

widgets.field_text = function (input, id) {
  var name = input.name;
  var value = input.value || '';

  this.deps = function() {
    return {'bootstrap':[]};
  }

  this.form = function() {
    return {
      'label': {'type': 'field_text','name': 'label', 'label': 'Label'},
      'inline': {'type': 'field_boolean','name': 'inline', 'label': 'Inline'}
    };
  }

  this.toHTML = function(zones, value) {
    var label = '<label for="' + name + '" style="padding-right: 5px;">' + input.label + ':' + '</label>';
    var element;
    
    if (value) {
      element = '<input class="form-control input-small" type="text" name="' + name + '" value="' + (value || input.value) + '" />';
    } else {
      element = '<input class="form-control input-small" type="text" name="' + name + '" />';
    }

    if (input.inline) {
      return '<div class="controls form-inline">' + label + element + '</div>';
    } else {
      return label + element;
    }
  }
}

widgets.textarea = function (input, id) {
  var name = input.name || id;
  var label = input.label;
  var value = input.value || '';

  this.toHTML = function(zones, value) {
    return '<label for="' + name + '">' + label + '</label><textarea name="' + name + '" value="' + (value || input.value) + '"></textarea>';
  }
}

widgets.ckeditor = function (input, id) {
  var name = input.name || id;
  var label = input.label;
  var value = input.value || '';

  this.form = function() {
    return {'toolbar': {'type': 'field_text_select', 'choices': ['Basic', 'Advanced'], label:'Toolbar Type'}};
  }

  this.toHTML = function(zones, value) {
    return '<label for="' + name + '">' + label + '</label><textarea id="'+id+'" name="' + name + '" value="' + (value || input.value) + '"></textarea>';
  }

  this.script = function() {
    return 'CKEDITOR.replace("' + id + '",{toolbar:"Basic"});';
  }

  this.deps = function() {
    return {'jquery': [],'ckeditor': ['ckeditor.js']};
  }
}

widgets.iframe = function(input, id) {
  this.form = function() {
    return {'url': {'type': 'field_text', label:'URL'}};
  }

  this.toHTML = function() {
    return '<iframe src="' + input.url  + '" style="width: 100%; height: 800px;" ></iframe>';
  }
}

widgets.field_text_select = function (input) {
  var name = input.name;
  var choices = input.choices || ['a', 'b', 'c'];

  if (Array.isArray(choices)) {
    choices = _.object(choices, choices);
  }

  this.toHTML = function(zones, value) {
    var label = '<label for="' + name + '" >' + input.label + '</label>';

    var element = '<select name="' + name + '">';

    _.each(choices, function(choice) {
      element += '<option value="' + choice + '" >' + choice + '</option>';
    });

    element += '</select>';

    return label + element;
  }
}

widgets.submit = function (input) {
  var label = input.label;
  var type = input.type || 'primary';

  this.form = function() {
    return {"label": {"type":"field_text", "name": "label", "label": "Label"},
        'button_type': {'type':'field_text_select', 'name': "button_type",'choices': ['default', 'primary', 'success', 'info', 'warning', 'danger'], label:'Button Type'}
      };
  }

  this.deps = function() {
    return {'jquery': []};
  }

  this.toHTML = function() {
    return '<input type="submit" class="btn btn-' + input.button_type + '" value="' + label + '" />'
  }
}

widgets.field_date = function (input) {
  var name = input.name;
  var label = input.label;
  var value = input.value || '';

  this.head = function() {
    return ['<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/" rel="stylesheet">'];
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
  this.form = function() {
    return  {
      "value" : {"type": "field_text", "label" : "Text", "value" : input.value}
    };
  }

  this.isPage = function () {
    return true;
  }

  this.toHTML = function(zones, value) {
    return input.value;
  }
}
