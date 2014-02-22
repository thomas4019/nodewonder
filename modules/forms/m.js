var fs = require('fs'),
    _ = require('underscore'),
    deep = require('deep');

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

var bootstrap_settings = {
  errorAfterField: true,
  cssClasses: {
      label: ['control-label']
  }
};

widgets.field_boolean = function (input, id) {
  var name = input.name;
  var label = input.label;
  var value = input.value || false;

  this.model = 'Boolean';

  this.toHTML = function() {
    var form_html = '<label for="' + name + '" style="margin-right: 5px;" >' + (label ? label : name) + '</label>' + '<input type="checkbox" name="' + id + '" >'
    
    return form_html;
  }
}

widgets.form = function (input, id) {
  this.toHTML = function(zones, value) {
    var html = '<form action="/post" method="post">'

    if (input.widget) {
      html += '<input type="hidden" name="widget" value="' + input.widget + '" />';
    }

    html += zones.form.html();
    html += '</form>';
    return html;
  }
}

widgets.field_text = function (input, id) {
  var value = input.value || '';

  this.model = 'String';

  this.deps = {'jquery': [],'bootstrap':[]};

  this.form = function() {
    return {
      'label': {'type': 'field_text','name': 'label', 'label': 'Label'},
      'inline': {'type': 'field_boolean','name': 'inline', 'label': 'Inline'}
    };
  }

  this.toHTML = function(zones, value) {
    var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : input.name) + ':' + '</label>';
    var element;
    
    if (value) {
      element = '<input class="form-control input-small" type="text" name="' + id + '" value="' + (value || input.value) + '" />';
    } else {
      element = '<input class="form-control input-small" type="text" name="' + id + '" />';
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

  this.model = 'String';

  this.toHTML = function(zones, value) {
    return '<label for="' + name + '">' + label + '</label><textarea name="' + name + '" value="' + (value || input.value) + '"></textarea>';
  }
}

widgets.ckeditor = function (input, id) {
  var name = input.name || id;
  var label = input.label;
  var value = input.value || '';

  this.model = 'String';

  this.form = function() {
    return {'toolbar': {'type': 'field_text_select', 'choices': ['Basic', 'Advanced'], label:'Toolbar Type'}};
  }

  this.toHTML = function(zones, value) {
    return '<label for="' + name + '">' + label + '</label><textarea id="'+id+'" name="' + name + '" value="' + (value || input.value) + '"></textarea>';
  }

  this.script = function() {
    return 'CKEDITOR.replace("' + id + '",{toolbar:"Basic"});';
  }

  this.deps = {'jquery': [],'ckeditor': ['ckeditor.js']};
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

widgets.button = function (input) {
  var label = input.label;
  var type = input.type || 'primary';

  this.form = function() {
    return {"label": {"type":"field_text", "name": "label", "label": "Label"},
        'button_type': {'type':'field_text_select', 'name': "button_type",'choices': ['default', 'primary', 'success', 'info', 'warning', 'danger'], label:'Button Type'}
      };
  }

  this.deps = {'jquery': [], 'bootstrap': []};

  this.toHTML = function() {
    return '<input type="button" class="btn btn-' + input.button_type + '" value="' + label + '" >';
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

  this.deps = {'jquery': []};

  this.toHTML = function() {
    return '<input type="submit" class="btn btn-' + input.button_type + '" value="' + label + '" />'
  }
}

widgets.field_date = function (input) {
  var name = input.name;
  var value = input.value || '';

  this.model = 'Date';

  //this.head = ['<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/" rel="stylesheet">'];

  this.deps = {'jquery-ui': ['themes/smoothness/jquery-ui.min.css'] };

  this.toHTML = function() {
    var label = '';
    if (input.label)
      label = '<label for="' + name + '" style="padding-right: 5px;">' + input.label + ':' + '</label>';

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

  this.wrapper = 'none';

  this.toHTML = function(zones, value) {
    return input.value;
  }
}

widgets.field_multi = function(input, id) {
  this.model = 'Array';

  var w_type = input.widget;
  var w_input = input;
  delete w_input['widget'];
  w_input['type'] = w_type;

  this.children = function(callback) {
    var state = {"body": {}};
    state["body"]["add"] = {"type": "button", "label": "Add more items"}

    var count = input.data ? input.data.length : 3;

    for (var i = 0; i < count; i++) {
      state["body"]["" + i] = deep.clone(w_input);
    }

    state["body"]["click"] = {
      "sel": "#" + id + "-add input",
      "type": "clicked",
    }
    state["body"]["add_action"] = {
      //"js": "$('#" + id + " button').before('<div>Hello World</div>');",
      "js": "nw.insertWidgetBefore('" + w_type + "','" + id + "-'+(nw.counter++), '"+ JSON.stringify(w_input) + "', '#" + id + "-add')",
      "type": "execute",
    }
    state["body"]["rule"] = {
      "type": "rule",
      "slots": {
        "events": [id+"-"+"click"],
        "conditions": [],
        "actions": [id+"-"+"add_action"]
      }
    };
    callback(state);
  }

  this.wrapper_style = "padding-left: 5px;";  

  this.script = function() {
    return 'nw.counter = 3;';
  }

  this.toHTML = function(slots) {
    var label = '<label style="padding-right: 5px;">' + input.name + ':' + '</label>';
    var arr = '<input type="hidden" name="'+id+'" value="new Array" />';
    return label + arr + slots.body.html();
  }
}