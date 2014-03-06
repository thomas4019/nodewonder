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

  this.processData = function(value) {
    return value == "on";
  }

  this.toHTML = function() {
    var form_html = '<label for="' + name + '" style="margin-right: 5px;" >' + (label ? label : name) + '</label>' + 
    '<input type="checkbox" name="' + id + '" ' + (input.data ? 'checked="checked"': '' ) + ' >'
    
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
  var label = input.label || input.name;

  this.model = 'String';

  this.form = function() {
    return {'toolbar': {'type': 'field_text_select', 'choices': ['Basic', 'Advanced'], label:'Toolbar Type'}};
  }

  this.toHTML = function(zones, value) {
    return '<label for="' + name + '">' + label + '</label><textarea id="'+id+'-Editor" name="' + name + '">' + (value || input.value || '') + '</textarea>';
  }

  this.script = function() {
    return 'CKEDITOR.replace("' + id + '-Editor",{toolbar:"Basic"});';
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

widgets.field_date = function (input, id) {
  var name = input.name;

  this.model = 'Date';

  //this.head = ['<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/" rel="stylesheet">'];

  this.deps = {'jquery-ui': ['themes/smoothness/jquery-ui.min.css'] };

  this.toHTML = function(value_in) {
    var label = '';
    if (input.label != '<none>')
      label = '<label for="' + name + '" style="padding-right: 5px;">' + (input.label ? input.label : input.name) + ':' + '</label>';

    var element;

    var value = input.data || value_in;

    if (!value || _.isEmpty(value))
      value = '';
    
    if (value) {
      element = '<input class="form-control input-small" type="text" name="' + id + '" value="' + value + '" />';
    } else {
      element = '<input class="form-control input-small" type="text" name="' + id + '" />';
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
  var count;

  delete w_input['widget'];
  w_input['type'] = w_type;
  w_input['inline'] = 'multi';

  this.children = function(callback) {
    var state = {"body": {}};

    var can_add = false;

    if (input.quantity.slice(-1) == '+') {
      can_add = true;
      input.quantity = input.quantity.substring(0, input.quantity.length - 1)
    }

    if (can_add) {
      state["body"]["add"] = {"type": "button", "button_type": "primary", "label": "Add more items"}
    }

    count = (input.data && Array.isArray(input.data)) ? input.data.length : input.quantity;

    if (count == '') {
      count = 3;
    }

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
    return 'nw.counter = ' + (count) + ';';
  }

  this.toHTML = function(slots) {
    var label = '<label style="padding-right: 5px;">' + input.name + ':' + '</label>';
    var arr = '<input type="hidden" name="'+id+'" value="new Array" />';
    return label + arr + slots.body.html();
  }

  this.processData = function(value) {
    var out = [];
    var widget = new cms.widgets[w_type](input);

    _.each(value, function(ivalue) {
      out.push(widget.processData(ivalue));
    });

    return out;
  }
}