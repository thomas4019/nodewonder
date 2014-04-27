var fs = require('fs'),
    _ = require('underscore'),
    deep = require('deep'),
    moment = require('moment');

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

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

widgets.checkbox = function (input, id) {
  var name = input.name;
  var label = input.label;
  var value = input.value || false;

  this.tags = ['field_edit'];

  this.settings = function() {
    return  [ {"name": "label", "type": "Text"},
      {"name": "name", "type": "Text"},
      {"name": "data", "type": "Boolean"} ];
  }

  this.processData = function(value) {
    return value == "on";
  }

  this.toHTML = function(slots, value) {
    var form_html = '<div class="checkbox"> <label for="' + name + '" style="margin-right: 5px;" >' + 
    '<input type="checkbox" name="' + id + '" ' + (input.data || value ? 'checked="checked"': '' ) + ' >' + (label ? label : name)
    + '</label></div>';
    
    return form_html;
  }
}

//DELETE?
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

widgets.textbox = function (input, id) {
  this.tags = ['field_edit'];

  this.deps = {'jquery': [],'bootstrap':[]};

  this.settings = function() {
    return  [ {"name": "inline", "type": "Boolean"},
      {"name": "data", "type": "Text"} ];
  }

  this.toHTML = function(zones) {
    var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : '') + ':' + '</label>';
    var element;
    
    if (input.data) {
      element = '<input class="form-control input-small" type="text" name="' + id + '" value="' + htmlEscape(input.data) + '" />';
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

widgets.password = function (input, id) {
  this.tags = ['field_edit'];

  this.deps = {'jquery': [],'bootstrap':[]};

  this.settings = function() {
    return  [ {"name": "inline", "type": "Boolean"},
      {"name": "data", "type": "Text"} ];
  }

  this.toHTML = function(zones) {
    var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : '') + ':' + '</label>';
    var element;
    
    if (input.data) {
      element = '<input class="form-control input-small" type="password" name="' + id + '" value="' + htmlEscape(input.data) + '" />';
    } else {
      element = '<input class="form-control input-small" type="password" name="' + id + '" />';
    }

    if (input.inline) {
      return '<div class="controls form-inline">' + label + element + '</div>';
    } else {
      return label + element;
    }
  }
}


widgets.email_textbox = function (input, id) {
  this.tags = ['field_edit'];

  this.deps = {'jquery': [],'bootstrap':[]};

  this.settings = function() {
    return  [ {"name": "inline", "type": "Boolean"},
      {"name": "data", "type": "Email"} ];
  }

  this.toHTML = function(zones) {
    var label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : '') + ':' + '</label>';
    var element;
    
    if (input.data) {
      element = '<input class="form-control input-small" type="email" name="' + id + '" value="' + htmlEscape(input.data) + '" />';
    } else {
      element = '<input class="form-control input-small" type="email" name="' + id + '" />';
    }

    if (input.inline) {
      return '<div class="controls form-inline">' + label + element + '</div>';
    } else {
      return label + element;
    }
  }
}

widgets.numeric_textbox = function (input, id) {
  this.tags = ['field_edit'];

  this.deps = {'jquery': [],'bootstrap':[]};

  this.settings = function() {
    return  [ {"name": "inline", "type": "Boolean"},
      {"name": "data", "type": "Number"},
      {"name": "min", "type": "Number", "settings" : {"min": 2}},
      {"name": "max", "type": "Number"} ];
  }

  this.processData = function(data) {
    console.log('processing');
    return parseInt(data);
  }

  this.validateData = function(data) {
    console.log(data);
    console.log(input);
    if (input.max && data > input.max)
      return 'Number is too large';
    if (input.min && data < input.min)
      return 'Number is too small';
  }

  this.toHTML = function(zones) {
    var label = '<label class="control-label" for="' + id + '-textbox" style="padding-right: 5px;">' + (input.label ? input.label : '') + ':' + '</label>';
    var element;
    
    if (input.data) {
      element = '<input id="'+id+'-textbox" class="form-control input-small" type="number" name="' + id + '" value="' + htmlEscape(input.data) + '" />';
    } else {
      element = '<input id="'+id+'-textbox" class="form-control input-small" type="number" name="' + id + '" />';
    }

    if (input.inline) {
      return '<div class="controls form-inline">' + label + element + '</div>';
    } else {
      return label + element;
    }
  }
}

widgets.slider = function (settings, id) {
  this.tags = ['field_edit'];

  this.deps = {'jquery': [],'jquery-ui':['themes/smoothness/jquery-ui.css']};

  this.settings = function() {
    return  [ {"name": "data", "type": "Number"},
      {"name": "min", "type": "Number"},
      {"name": "max", "type": "Number"} ];
  }

  this.script = function() {
    var options = {range: 'max', min: settings.min || 1, max: settings.max || 10};
    if (settings.data)
      options.value = settings.data;
    options.slide = "REPLACE";
    var code = 'function( event, ui ) { $( "#'+id+' input" ).val( $( "#'+id+' .slider" ).slider( "value" ) );  }';
    options = JSON.stringify(options);
    options = options.replace('"REPLACE"',code);
    return '$( "#'+id+' .slider" ).slider(' + options + '); ';
  }

  this.toHTML = function(zones) {
    var label = '<label for="' + id + '" style="padding-right: 5px;">' + (settings.label ? settings.label : '') + ':' + '</label><input name="'+id+'" type="textbox" style="border:0; color:#f6931f; font-weight:bold;" ' + (settings.data ? 'value="'+settings.data : '') +'" />';
    var element;
    
    element = '<div class="slider" />';
    
    return label + element;
  }
}

widgets.textarea = function (input, id) {
  var name = input.name || id;
  var label = input.label;
  var value = input.value || '';

  this.tags = ['field_edit'];

  this.settings = function() {
    return  [ {"name": "label", "type": "Text"},
      {"name": "name", "type": "Text"},
      {"name": "data", "type": "Text"} ];
  }

  this.toHTML = function(zones, value) {
    var label = '<label for="' + name + '">' + (input.label ? input.label : input.name) + ':</label>'
    var element = '<textarea class="form-control input-small"  name="' + id + '" >'+ (input.data || value || input.value || '')+'</textarea>';

    return label + element;
  }
}

widgets.ckeditor = function (input, id) {
  var name = input.name || id;
  var label = input.label || input.name;

  this.tags = ['field_edit'];

  this.settings = function() {
    return  [ {"name": "label", "type": "Text"},
      {"name": "toolbar", "type": "Text", "widget": "select", "settings": {label:'Button Type', choices: ['Basic', 'Advanced']} },
      {"name": "data", "type": "Text"} ];
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
  this.settings = function() {
    return [ {"name": "url", 'type': 'Text'} ];
  }

  this.toHTML = function() {
    return '<iframe src="' + input.url  + '" style="width: 100%; height: 800px;" ></iframe>';
  }
}

widgets.select = function (input, id) {
  var name = input.name;
  var choices = input.choices;

  if (Array.isArray(choices)) {
    choices = _.object(choices, choices);
  }

  this.tags = ['field_edit'];
  this.settings = [{"name": "data", "type": "Text"}];

  this.toHTML = function(zones, value) {
    var label = '<label for="' + name + '" >' + input.label + '</label>';

    var element = '<select name="' + id + '">';

    _.each(choices, function(choice) {
      element += '<option value="' + choice + '" ' + (choice == input.data ? 'selected="selected"' : '') + ' >' + choice + '</option>';
    });

    element += '</select>';

    return label + element;
  }
}

widgets.button = function (input, id) {
  var label = input.label;
  var type = input.type || 'primary';

  this.wrapper = 'span';

  this.settings = function() {
    return  [ {"name": "label", "type": "Text"},
      {"name": "button_type", "type": "Text", "widget": "select", "settings": {label:'Button Type', choices: ['default', 'primary', 'success', 'info', 'warning', 'danger']} } ];
  }

  this.script = function() {
    var slots = this.all_children;
    var code = '';
    if (slots.onclick) {
      code += '$("#' + id + '").on( "click", function() {' + cms.functions.concatActions(slots.onclick) + '});';
    }
    if (slots.on_dblclick) {
      code += '$("#' + id + '").on( "dblclick", function() {' + cms.functions.concatActions(slots.on_dblclick) + '});';
    }
    if (slots.enter) {
      code += '$("#' + id + '").on( "mouseenter", function() {' + cms.functions.concatActions(slots.enter) + '});';
    }
    return code;
  }

  this.deps = {'jquery': [], 'bootstrap': []};

  this.toHTML = function() {
    return '<input type="button" class="btn btn-' + input.button_type + '" value="' + label + '" >';
  }
}

widgets.submit = function (input) {
  var label = input.label;

  this.settings = function() {
    return  [ {"name": "label", "type": "Text"},
      {"name": "button_type", "type": "Text", "widget": "select", "settings": {label:'Button Type', choices: ['default', 'primary', 'success', 'info', 'warning', 'danger']} } ];
  }

  this.deps = {'jquery': []};

  this.toHTML = function() {
    return '<input type="submit" class="btn btn-' + input.button_type + '" value="' + label + '" />'
  }
}

widgets.date = function (input, id) {
  var name = input.name;

  this.deps = {'jquery-ui': ['themes/smoothness/jquery-ui.min.css'] };

  this.tags = ['field_edit'];
  this.settings = [{"name": "data", "type": "Date"}];

  this.toHTML = function() {
    var label = '';
    if (input.label != '<none>')
      label = '<label for="' + id + '" style="padding-right: 5px;">' + (input.label ? input.label : input.name) + ':' + '</label>';

    var value = input.data ? moment(input.data).format('MM/DD/YYYY') : '';

    if (!value || _.isEmpty(value))
      value = '';

    var element;    
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

  this.processData = function(data) {
    return new Date(data).getTime();
  }

  this.script = function(container_id) {
    return '$("#' + container_id + ' input").datepicker();';
  }
}

widgets.field_multi = function(input, id) {
  var w_type = input.widget;
  var w_input = input;
  var count;

  delete w_input['widget'];
  w_input['inline'] = 'multi';

  this.children = function(callback) {
    var state = {"body": {}};

    var can_add = false;

    if (input.quantity && input.quantity.slice(-1) == '+') {
      can_add = true;
      input.quantity = input.quantity.substring(0, input.quantity.length - 1)
    }

    if (can_add) {
      state["body"]["add"] = {"type": "button", "slots": {"events": ["onclick"]}}
      state["body"]["add"]["settings"] = {"button_type": "primary", "label": "Add more items"}
    }

    count = (input.data && Array.isArray(input.data)) ? input.data.length : input.quantity;

    if (count == 0) {
      count = input.quantity;
    }
    if (count == '') {
      count = 3;
    }

    for (var i = 0; i < count; i++) {
      state["body"]["" + i] = {};
      state["body"]["" + i]['type'] = w_type;
      state["body"]["" + i]['settings'] = deep.clone(w_input);
      if (input.data && input.data[i])
        state["body"]["" + i]['settings']['data'] = input.data[i];
    }

    state["body"]["onclick"] = {
      "type": "onclick",
      "slots": {"actions": ["add_action"]}
    }
    state["body"]["add_action"] = {
      "type": "execute",
      "settings": {"js": "nw.functions.insertWidgetBefore('" + w_type + "','" + id + "-'+(nw.counter['"+id+"']++), '"+ JSON.stringify(w_input) + "', '#" + id + "-add')"},
    }
    callback(state);
  }

  this.wrapper_style = "padding-left: 5px;";  

  this.script = function() {
    return 'nw.counter["'+id+'"] = ' + (count) + ';';
  }

  this.toHTML = function(slots) {
    var label = '<label style="padding-right: 5px;">' + input.label + ':' + '</label>';
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