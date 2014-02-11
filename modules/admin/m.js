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
}var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

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

widgets.calendar = function() {
  this.deps = function() {
    return {'jquery': [], 'jquery-ui': [], 'fullcalendar': ['fullcalendar.min.js','fullcalendar.css']};
  }

  this.script = function() {
    return "$('#fcalendar').fullCalendar({ header: { left: 'prev,next today', center: 'title', " + 
      "right: 'month,agendaWeek,agendaDay' }, editable: true});";
  }

  this.toHTML = function() {
    return '<div id="fcalendar"></div>';
  }
}var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
functions = module.exports.functions;

functions.processDeps = function(deps) {
  if (!deps) {
    return '';
  }
  var order = deps['order'];
  delete deps['order'];
  order = _.union(order, Object.keys(deps));
  var head = [];
  _.each(order, function(dep, index) {
    var depFiles = _.union(cms.deps[dep], deps[dep]);
    head.push(cms.functions.processDep(dep, depFiles));
  });

  return head;
}

functions.processDep = function(dep, depFiles) {
  var folder = 'bower_components/' + dep + '/';

  var html = '';
  _.each(depFiles, function(file, index) {
    if (file) {
      html += cms.functions.fileToHTML('/' + folder, file);
    }
  });
  return html;
}

functions.fileToHTML = function(folder, file) {
  if (!file || typeof file !== 'string') {
    console.log('invalid dependency:' + folder + ' ' + JSON.stringify(file));
    return;
  }
  var ext = file.split('.').pop();
  var full = folder + file;
  if (ext == 'js') {
    return '<script type="text/javascript" src="' + full + '"></script>';
  } else if (ext == 'css') {
    return '<link rel="stylesheet" href="' + full + '" />';
  } else {
    return '';
  }
}var forms = require('forms'),
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
var fs = require('fs'),
    url = require('url'),
    _ = require('underscore');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

widgets.site_log = function(input) {
  this.head = function() {
    return ['<script src="/socket.io/socket.io.js"></script>',
      '<script src="/modules/log/site_log.js" type="text/javascript"></script>']
  }

  this.toHTML = function() {
    return '<h2>Site Activity</h2><div id="log"></div>';
  }
}

functions.log = function(type, message, data) {
  console.log(type);
}module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.youtube_video = function (input) {
  this.form = function() {
    return  {
      "id" : {"name": "id", "type": "field_text", "label" : "Video ID", "value" : input.id}
    };
  }

  this.toHTML = function() {
    return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + input.id + '" frameborder="0" allowfullscreen></iframe>';
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require("handlebars");

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

var page_template;

fs.readFile('page.html', 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  page_template = Handlebars.compile(data);
});

functions.viewPage = function(path, vars, callback, error_callback) {
  if (path == '/') {
    path = 'index'
  }
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      //console.log(err);
      error_callback();
      return;
    }
    var jdata = JSON.parse(data);
    var state = jdata.widgets;
    var slotAssignments = jdata.slotAssignments;
    var rules = jdata.rules || [];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>';
      state = cms.functions.splitAndFill(state, vars);

      if ('json' in vars) {
          var json = JSON.stringify(state, null, 4);
          //json = json.replace(/\n/g,'</br>');
          //json = json.replace(/\s+/gm, function(spaces) { return spaces.replace(/./g, '&nbsp;'); } );
          callback(json, 'text/javascript');
      } else {
        cms.functions.renderState(state, slotAssignments, function(html, head) {
          var content_type = jdata.contentType ? jdata.contentType : 'text/html';

          if (content_type == 'text/html') {
            var encoded_head = JSON.stringify(head);
            encoded_head = encoded_head.replace(/<\/script/g, '</scr"+"ipt');
            var head_meta = '<script type="text/javascript">var head = ' + encoded_head + ';</script>';
            head.push(head_meta);
            var html = page_template({
              'head': head.join('\n') + script,
              'body': html
            });
          }
          callback(html, content_type);
        }, script, deps);
      }
    });
  });
}

widgets.echo = function(input) {
}

widgets.page_listing = function(input) {
  var paths = [];

  this.load = function(callback) {
    dive('pages', {}, function(err, file) {
      var pa = path.relative('pages',file).slice(0, -5);
      var ext = path.extname(file);
      if (ext == '.json') {
        paths.push(pa);
      }
    }, callback);
  }

  this.toHTML = function() {
    var html = '<h1>Pages</h1><ul class="list-group">';
    _.each(paths, function(path, index) {
      var edit_path = 'admin/pages/edit?storage-file=' + path + '&editor-page=' + path + '&preview-url=/' + path;
      html += '<li class="list-group-item" >' +
      '<a href="/' + edit_path + '"><span class="glyphicon glyphicon-edit"></span></a> ' +
      '<a href="/' + path + '">' + path + '</a></li>';
    });
    html += '</ul>';
    return html;
  }
}var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    fwidgets = forms.widgets,
    fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

functions.ruleToJS = function(rule) {
  var eventName = Object.keys(rule.event)[0];
  var eventInput = rule.event[eventName];
  var event = new cms.events[eventName](eventInput);
  var script = '';
  var head = '';
  var deps = [];
  _.each(rule.actions, function(action, index) {
    var name = Object.keys(action)[0];
    var input = action[name];
    var actionObject = new cms.actions[name](input);
    script += actionObject.toJS();
    head += actionObject.head ? actionObject.head() : '';
    if (actionObject.deps) {
      dextend(deps, actionObject.deps());
    }
  });

  head += event.head ? event.head() : '';

  return [event.toJS(script), deps];
}

functions.processRules = function(rules, callback) {
  var script = '';
  var head = '';
  var deps = {};
  _.each(rules, function(rule, index) {
    results = cms.functions.ruleToJS(rule);
    script += results[0];
    //head += results[1];
    dextend(deps, results[1]);
  });
  callback(script, deps);
}


events.load = function (input) {
  this.toJS = function(code) {
    return code
  }
}

events.clicked = function(input) {
  sel = input.sel;

  this.input = function() {
    return  {
      "sel:field_text" : {"label" : "CSS Selector", "value" : input.sel},
    };
  }

  this.toJS = function(code) {
    return '$("' + sel + '").on( "click", function() {' + code + '});'
  } 
}

actions.refresh = function(input) {
  this.toJS = function() {
    return 'location.reload();';
  }
}

actions.execute = function(input) {
  this.toJS = function() {
    return input.js;
  }
}

actions.alert = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'alert("' + message + '");';
  }
}

actions.message = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'toastr.info("' + message + '");';
  }

  this.deps = function() {
    return {'toastr': []};
  }
}


widgets.rule_page_editor = function(input) {
  var page = input.page;

  this.children = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      var jdata = JSON.parse(data);
      var state = jdata[0];
      var rules = jdata[1];
      var state2 = {};

      _.each(rules, function(rule, index) {
        state2['r' + index + ':' + 'rule_settings'] = rule;
      });

      callback({'body' : state2 });
    }); 
  }

  this.deps = function() {
    return {'jquery-ui': []};
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

widgets.rule_settings = function(input, id) {
  var rule = input;

  this.children = function(callback) {
    var c = {};

    c['e:rule_event_settings'] = rule.event;
    _.each(rule.actions, function(action, index) {
      c['a' + index + ':rule_action_settings'] = action;
    });

    callback({'body' : c});
  }

  this.toHTML = function(zones) {
    return '<div class="well">' + (zones['body'] || '') + '</div>';
  }
}

widgets.rule_event_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var eventInstance = new cms.events[type](input[type]);
    callback(eventInstance.input ? {'body' : eventInstance.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}


widgets.rule_action_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var action = new cms.actions[type](input[type]);
    callback(action.input ? {'body' : action.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    path = require('path'),
    dextend = require('dextend');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

functions.organizeState = function(state, callback) {
  var widgets_buffer = {};
  var count = 1;

  var initializeWidget = function(w, id) {
    var name = w.type;
    if (cms.widgets[name]) {
      var widget = new cms.widgets[name](w, id);
      widget.id = id;
    } else {
      console.log('Missing widget:' + name);
    }
    widget.all_children = {};

    if (widget.children) {
      count++;
      widget.children(function(children) {
        _.each(children, function(widgetStateList, zone) {
          var heirarchical = false;
          _.each(widgetStateList, function(widgetInput, idC) {
            var nameC = widgetInput.type;
            if (idC == 'start') {
              idC = id + 'inner-' + idC;
              key = idC + ':' + nameC;
            }
            if (!heirarchical) {
              w.slots = w.slots || {};
              w.slots[zone] = w.slots[zone] || [];
              w.slots[zone].push(idC);
            }
            if (partsC[0] == 'start') {
              heirarchical = true;
            }
            state[key] = widgetInput;

            initializeWidget(widgetInput, key);
          });
        });
        count--;
        part2();
      });
    }

    widgets_buffer[id] = widget;
    return widget;
  }

  //initialize each widget
  _.each(state, function(w, key) {
    initializeWidget(w, key)
  });

  count--;
  part2();

  function part2() {
    if (count != 0)
      return;

    //console.log(state);

    //connect the children to the parents
    _.each(state, function(w, id) {
      var widget = widgets_buffer[id];

      if (w.slots) {
        addChildrenToWidget(w.slots, widget);
      }
    });

    callback(widgets_buffer);
  }

  function addChildrenToWidget(zones, widget) {
    _.each(zones, function(widgetList, slot) {
      if (!widget.all_children[slot]) {
        widget.all_children[slot] = [];
      }
      _.each(widgetList, function(sub_id, i) {
        var sub = widgets_buffer[sub_id];
        if (typeof sub !== 'undefined') {
          widget.all_children[slot].push(sub);
          sub.parent = widget;
        } else {
          console.log('Invalid widget reference:' + sub_id);
        }
      });
    });
  }
}

functions.splitAndFill = function(state, values) {
  return cms.functions.fillValues(state, cms.functions.splitValues(values));
}

functions.splitValues = function(values) {
  var widgetValues = {};

  _.each(values, function(value, key) {
    var parts = key.split("-");
    if (parts.length == 2) {
      var widget_id = parts[0];
      var value_id = parts[1];

      if (!widgetValues[widget_id]) {
        widgetValues[widget_id] = {};
      }

      widgetValues[widget_id][value_id] = value;
    }
  });

  return widgetValues;
}

functions.fillValues = function(state, values) {
  _.each(state, function(w, id) {
    if (values[id]) {
      state[id] = _.extend(w, values[id]);
    }
  });

  return state;
}

functions.renderState = function(state, slotAssignments, callback, head_additional, deps) {
  cms.functions.renderStateParts(state, slotAssignments, function(html, deps, head, script) {
    var all_head = [];
    all_head = all_head.concat(head);
    all_head = all_head.concat(cms.functions.processDeps(deps));
    all_head.push('<script>$(function() {' + script + '});</script>');
    callback(html, all_head);
  });
}

functions.renderStateParts = function(state, slotAssignments, callback, values) {
  var head = [];
  var head_map = {};
  var script = '';

  var initial_values = values || {};

  cms.functions.organizeState(state, function(widgets_buffer) {
    loadAndPrepare(widgets_buffer);
  });

  function toHTML(widget, values) {
    if (widget.head) {
      _.each(widget.head(), function(head_element) {
        if (!(head_element in head_map)) {
          head_map[head_element] = true;
          head.push(head_element);
        }
      });
    }
    if (widget.script) {
      script += widget.script(widget.name);
    }
    if (widget.values) {
      _.extend(values, widget.values());
    }

    var zones = {};
    if (widget.zones) {
      _.each(widget.zones(), function(zone) {
        zones[zone] = '';
      });
    }

    _.each(widget.all_children, function(widgetList, zone) {
      var zone_html = '';

      _.each(widgetList, function(w, i) {
        zone_html += toHTML(w, values);
      });

      zones[zone] = zone_html;
    });

    var widget_html = '';
    if (widget.toHTML) {
      widget_html = widget.toHTML(zones, values[widget.id]);
    } else {
      _.each(zones, function(zone_html) {
        widget_html += zone_html;
      });
    }

    if (widget.isPage) {
      return widget_html;
    } else {
      return '<div class="widget-container widget-' + widget.name + '" id="' + widget.name + '">' + widget_html + '</div>';
    }
  }

  function loadAndPrepare(widgets_buffer) {
    var deps = {};

    async.each(Object.keys(widgets_buffer), function(id, callback) {
      var widget = widgets_buffer[id];
      if (widget.deps) {
        dextend(deps, widget.deps());
      }
      if (widget.load)
        widget.load(callback);
      else
        callback();
    }, function(err, results) {
      var html = '';
      _.each(slotAssignments['body'], function(id, index) {
        if (widgets_buffer[id]) {
          html += toHTML(widgets_buffer[id], initial_values);
        } else {
          console.log("Widget missing " + id);
        }
      });

      callback(html, deps, head, script);
    });
  }
}

widgets.state_editor = function (input, id) {
  var page = input.page || 'test';

  this.script = function() {
    return '$("input[type=\'submit\']").click(exportState);';
  }

  this.head = function() {
    return ['<script src="/modules/pages/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/pages/state-editor.css" />']
  }

  this.deps = function() {
    return {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};
  }

  this.toHTML = function(zones, value) {
    var v = JSON.stringify(value);
    return '<script type="text/javascript">var page = "'+ page + '"; var state = ' + v + ';</script>' +
    '<textarea style="display:none;" name="state">' + v + '</textarea>' +
    '<div ng-app><ul id="state-ctrl" ng-controller="stateController">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/pages/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/pages/widget.html\'"></li>' +
    '</div>';
  }
}var path = require('path'),
    _ = require('underscore'),
    fs = require('fs'),
    dive = require('dive'),
    mkdirp = require('mkdirp');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets; 
var functions = module.exports.functions;

functions.pageToStatic = function(fpath) {
  fs.readFile('pages/' + fpath + '.json', 'utf8', function(err, data) {
    if (err) {
      console.trace("Here I am!")
      return console.log(err);
    }
    console.log('static: ' + fpath);
    var jdata = JSON.parse(data);
    var state = jdata[0];
    var rules = jdata[1];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>'
      console.log('- ' + fpath);
      cms.functions.renderState(state, {}, function(html) {
        mkdirp(path.dirname('static/' + fpath), function(err) { 
          fs.writeFile('static/' + fpath  + '.html', html);
        });
      }, script, deps); //'<base href="http://localhost:3000/" target="_blank" >'
    });
  });
}

functions.allPagesToStatic = function() {
  dive('pages', {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative('pages',file).slice(0, -ext.length);
    if (ext == '.json') {
      cms.functions.pageToStatic(pa);
    }
  });
}

//http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
functions.copyFile = function(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

functions.staticThemeCopy = function() {
  var theme = 'themes/html5up-tessellate/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    mkdirp(path.dirname('static/' + pa), function(err) { 
      cms.functions.copyFile(file, 'static/' + pa, function() {

      });
    });
  });
}

functions.staticModulesCopy = function() {
  var theme = 'modules/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    if (ext == '.css' || ext == '.js' && pa.substr(pa.length - 4) != 'm.js') {
      mkdirp(path.dirname('static/' + pa), function(err) { 
        cms.functions.copyFile(file, 'static/' + pa, function() {

        });
      });
    }
  });
}var fs = require('fs'),
    _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets;

var copy = function (original) {
  return Object.keys(original).reduce(function (copy, key) {
      copy[key] = original[key];
      return copy;
  }, {});
}

widgets.json = function(input) {
  var file = input.file;
  var dir = input.dir || 'storage';
  var widget = input.widget || 'json'
  var values;

  this.deps = function() {
    return {'jquery' : []};
  }

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="file" value="' + file + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones['form'] + 
    '</form>';
  }

  this.load = function(callback) {
    fs.readFile(dir + '/' + file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      values = JSON.parse(data);
      callback();
    });
  }

  this.values = function() {
    return values;
  }

  this.save = function(values) {
    console.log(values);
    delete values['file'];
    fs.writeFile(dir + '/' + file + '.json', JSON.stringify(values, null, 4));
  }
}

widgets.ijson = function(input) {
  var dir = input.dir || 'storage/survey';
  var widget = input.widget || 'ijson'
  var values;

  this.deps = function() {
    return {'jquery' : []};
  }

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="id" value="' + input.id + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones['form'] + 
    '</form>';
  }

  this.load = function(callback) {
    if (typeof input.id !== 'undefined' && input.id != 'undefined') {
      fs.readFile(dir + '/' + (input.id) + '.json', 'utf8', function(err, data) {
        if (err) {
          console.trace("Here I am!")
          return console.log(err);
        }
        values = JSON.parse(data);
        console.log(values);
        callback();
      });
    } else {
      callback();
    }
    
  }

  this.values = function() {
    return values;
  }

  this.save = function(values) {
    console.log('-------');
    delete values['file'];
    delete values['dir'];
    var id = (typeof values.id !== 'undefined' && values.id != 'undefined') ? values.id : (widgets.ijson.counter++);
    delete values['id'];
    fs.writeFile(dir + '/' + id  + '.json', JSON.stringify(values, null, 4));
  }
}
widgets.ijson.init = function() {
  widgets.ijson.counter = 0;
  var files = fs.readdirSync('storage/survey');
  _.each(files, function(file) {
    var current = parseInt(file.split('.')[0]);
    if (current > widgets.ijson.counter) {
      widgets.ijson.counter = current + 1
    }
  });
}

widgets.pagejson = function(input) {
  input.widget = 'pagejson';
  var f = new widgets.json(input);

  f.save  = function(values) {
    var widgetValues = cms.m.pages.functions.splitValues(values);

    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        console.log(err);
      }
      var jdata = JSON.parse(data);
      jdata.widgets = cms.m.pages.functions.fillValues(jdata.widgets, widgetValues);
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata.widgets, null, 4));
    });
  }

  return f;
}

widgets.statejson = function(input) {
  input.widget = 'statejson';
  var f = new widgets.json(input);
  var current_state;

  f.load = function(callback) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.log("JSON file doesn't exist");
        current_state = {};
        //console.log(err);
        callback();
        return;
      }
      var jdata = JSON.parse(data);
      current_state = jdata;
      callback();
    });
  }

  f.values = function() {
    return {'editor': current_state};
  }

  f.save  = function(values) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      var jdata;
      if (err) {
        console.log("JSON file doesn't exist")
        //console.log(err);
        jdata = {};
      } else {
        jdata = JSON.parse(data);
      }
      var newData = JSON.parse(values['state']);
      jdata.widgets = newData.widgets;
      jdata.slotAssignments = newData.slotAssignments;
      console.log(newData);
      console.log(JSON.stringify(jdata));
      console.log(input.dir + '/' + input.file + '.json');
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata, null, 4));
    });
  }

  return f;
}var fs = require('fs'),
    Handlebars = require("handlebars");

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.template = function(input) {
  var that = this;
  this.path = input.path;

  this.zones = function() {
    {name : 'body'};
  }

  this.isPage = function() {
    return true;
  }

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = Handlebars.compile(data);
      callback();
    });
  }

  this.toHTML = function(zones) {
    return this.template(zones);
  }
}

widgets.htmlfile = function(input) {
  var that = this;
  this.path = input.path;

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = data;
      callback();
    });
  }

  this.toHTML = function() {
    return this.template;
  }
}

widgets.centered = function() {
  this.zones = function() {
    return ['content'];
  }

  this.toHTML = function(zones) {
    var template = Handlebars.compile('<div style="margin-left: auto; width: 700px; margin-right: auto; border: 1px solid black; border-radius: 10px; padding: 15px; ">' + 
    ' {{{ content }}} </div>');
    return template(zones);
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.login = function() {
  this.children = function(callback) {
    /*var state = {"start:htmlfile": {
        "path": "login.html"
    }};*/
    var state = {
        "start:form": {'widget': 'login','zones': {'form': ["username", "password", "save"]}},
        "username:field_text" : {"label": "Username"},
        "password:field_text" : {"label": "Password"},
        "save:submit" : {"label": "Login"},
    };
    callback({'body': state});
  }

  this.save = function(values) {
    console.log(values);
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

passport.use(new LocalStrategy(
  function(username, password, done) {
    /*User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });*/
    if (username == 'thomas')
      return done(null, user);
    else
      return done(null, false, { message: 'Incorrect username.' });
  }
));var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets,
    _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.two_col = function(input) {
  this.col1 = input.col1 || 6;
  this.col2 = input.col2 || 6;

  this.form = function() {
    return  {
      "col1" : {"type": "field_text", "label" : "Col 1 Width", "value" : this.col1},
      "col2" : {"type": "field_text", "label" : "Col 2 Width", "value" : this.col2}
    };
  }

  this.deps = function() {
    return {'jquery':[],'bootstrap': []};
  }

  this.toHTML = function(zones) {
    return '<div class="row"><div class="col-sm-' + this.col1 + '">' + zones['left'] + 
      '</div><div class="col-sm-' + this.col2 + '">' + zones['right'] + '</div></div>';
  }

  this.zones = function() {
    return ['left', 'right'];
  }
}

widgets.widget_selector = function (input, id) {
  var children = [];
  var html;

  this.deps = function() {
    return {'select2': []};
  }

  this.load = function(callback) {
    html = '<select class="widget-selector" style="display: none; width: 300px;">'
    html += '<option value="">- Select Widget -</option>'

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
      html += '<option value="' + w.name + '" data-form=\'' + (w.form ? true : false) + '\' data-zones=\''+ (w.zones ? JSON.stringify(w.zones()) : []) +'\'>' + w.name + '</option>'
    });

    html += '</select>';

    callback();
  }


  this.script = function() {
    return '$(".widget-selector").select2();';
  }

  this.toHTML = function(zones, value) {
    return html;
  }
}

widgets.widget_exporter = function(input) {
  var type = input.type || 'state_editor';
  var widget_input = {};
  var show_form = input.show_form || false;
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  if (input.input) {
    widget_input = JSON.parse(input.input);
  }
  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.isPage = function() {
    return true;
  }

  this.load = function(callback) {
    var viewReady = function(html, content_type, deps, head, javascript) {
      var all_head = [];
      all_head = all_head.concat(head);
      all_head = all_head.concat(cms.functions.processDeps(deps));
      _html = html;
      _head = all_head;
      _script = javascript;
      callback();
    }

    var state = false;

    if (show_form) {
      widget = new cms.widgets[type](values);
      if (widget.input) {
        state = widget.input();
      } else {
        error = 'Widget does not have a form';
      }
    } else {
      widget_input['type'] = type;
      state = {
        "start" : widget_input
      };
    }

    if (state) {
      cms.functions.renderStateParts(state, ['start'], viewReady);
    } else {
      callback();
    }
  }

  this.toHTML = function() {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    var out = {};
    var widget = cms.widgets[type];
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }
}

widgets.page_widget_form = function(input) {
  var widget_input = {};
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  if (input.input) {
    widget_input = JSON.parse(input.input);
  }
  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.isPage = function() {
    return true;
  }

  this.load = function(callback) {
    var viewReady = function(html, deps, head, javascript) {
      var all_head = [];
      console.log(html);
      all_head = all_head.concat(head);
      all_head = all_head.concat(cms.functions.processDeps(deps));
      _html = html;
      _head = all_head;
      _script = javascript;
      callback();
    }

    var state = false;

    fs.readFile('pages' + '/' + input.widget_page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace('JSON missing');
      }

      var jdata = JSON.parse(data);
      var widget_input = jdata.widgets[input.widget_id];

      widget = new cms.widgets[input.widget_type](widget_input);
      if (widget.form) {
        state = widget.form();
      } else {
        error = 'Widget does not have a form';
      }

      console.log(state);
      console.log(_.keys(state));

      if (state) {
        cms.functions.renderStateParts(state, {'body': _.keys(state) }, viewReady, widget_input);
      } else {
        callback();
      }
    });
  }

  this.toHTML = function(zones) {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    console.log('123');

    var out = {};
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }

  this.save = function(values) {
    fs.readFile('pages' + '/' + values.widget_page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("JSON file doesn't exist")
        console.log(err);
        return false
      }
      var jdata = JSON.parse(data);

      var page = values.widget_page;
      var id = values.widget_id;
      var type = values.widget_type;
      delete values['widget_page'];
      delete values['widget_id'];
      delete values['widget_type'];
        
      jdata.widgets[id] = values;
      jdata.widgets[id].type = type;
      fs.writeFile('pages' + '/' + page + '.json', JSON.stringify(jdata, null, 4));
      console.log('updated state of ' + page);
      console.log(values);
    });
  }
}var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

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

widgets.calendar = function() {
  this.deps = function() {
    return {'jquery': [], 'jquery-ui': [], 'fullcalendar': ['fullcalendar.min.js','fullcalendar.css']};
  }

  this.script = function() {
    return "$('#fcalendar').fullCalendar({ header: { left: 'prev,next today', center: 'title', " + 
      "right: 'month,agendaWeek,agendaDay' }, editable: true});";
  }

  this.toHTML = function() {
    return '<div id="fcalendar"></div>';
  }
}var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
functions = module.exports.functions;

functions.processDeps = function(deps) {
  if (!deps) {
    return '';
  }
  var order = deps['order'];
  delete deps['order'];
  order = _.union(order, Object.keys(deps));
  var head = [];
  _.each(order, function(dep, index) {
    var depFiles = _.union(cms.deps[dep], deps[dep]);
    head.push(cms.functions.processDep(dep, depFiles));
  });

  return head;
}

functions.processDep = function(dep, depFiles) {
  var folder = 'bower_components/' + dep + '/';

  var html = '';
  _.each(depFiles, function(file, index) {
    if (file) {
      html += cms.functions.fileToHTML('/' + folder, file);
    }
  });
  return html;
}

functions.fileToHTML = function(folder, file) {
  if (!file || typeof file !== 'string') {
    console.log('invalid dependency:' + folder + ' ' + JSON.stringify(file));
    return;
  }
  var ext = file.split('.').pop();
  var full = folder + file;
  if (ext == 'js') {
    return '<script type="text/javascript" src="' + full + '"></script>';
  } else if (ext == 'css') {
    return '<link rel="stylesheet" href="' + full + '" />';
  } else {
    return '';
  }
}var forms = require('forms'),
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
var fs = require('fs'),
    url = require('url'),
    _ = require('underscore');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

widgets.site_log = function(input) {
  this.head = function() {
    return ['<script src="/socket.io/socket.io.js"></script>',
      '<script src="/modules/log/site_log.js" type="text/javascript"></script>']
  }

  this.toHTML = function() {
    return '<h2>Site Activity</h2><div id="log"></div>';
  }
}

functions.log = function(type, message, data) {
  console.log(type);
}module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.youtube_video = function (input) {
  this.form = function() {
    return  {
      "id" : {"name": "id", "type": "field_text", "label" : "Video ID", "value" : input.id}
    };
  }

  this.toHTML = function() {
    return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + input.id + '" frameborder="0" allowfullscreen></iframe>';
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require("handlebars");

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

var page_template;

fs.readFile('page.html', 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  page_template = Handlebars.compile(data);
});

functions.viewPage = function(path, vars, callback, error_callback) {
  if (path == '/') {
    path = 'index'
  }
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      //console.log(err);
      error_callback();
      return;
    }
    var jdata = JSON.parse(data);
    var state = jdata.widgets;
    var slotAssignments = jdata.slotAssignments;
    var rules = jdata.rules || [];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>';
      state = cms.functions.splitAndFill(state, vars);

      if ('json' in vars) {
          var json = JSON.stringify(state, null, 4);
          //json = json.replace(/\n/g,'</br>');
          //json = json.replace(/\s+/gm, function(spaces) { return spaces.replace(/./g, '&nbsp;'); } );
          callback(json, 'text/javascript');
      } else {
        cms.functions.renderState(state, slotAssignments, function(html, head) {
          var content_type = jdata.contentType ? jdata.contentType : 'text/html';

          if (content_type == 'text/html') {
            var encoded_head = JSON.stringify(head);
            encoded_head = encoded_head.replace(/<\/script/g, '</scr"+"ipt');
            var head_meta = '<script type="text/javascript">var head = ' + encoded_head + ';</script>';
            head.push(head_meta);
            var html = page_template({
              'head': head.join('\n') + script,
              'body': html
            });
          }
          callback(html, content_type);
        }, script, deps);
      }
    });
  });
}

widgets.echo = function(input) {
}

widgets.page_listing = function(input) {
  var paths = [];

  this.load = function(callback) {
    dive('pages', {}, function(err, file) {
      var pa = path.relative('pages',file).slice(0, -5);
      var ext = path.extname(file);
      if (ext == '.json') {
        paths.push(pa);
      }
    }, callback);
  }

  this.toHTML = function() {
    var html = '<h1>Pages</h1><ul class="list-group">';
    _.each(paths, function(path, index) {
      var edit_path = 'admin/pages/edit?storage-file=' + path + '&editor-page=' + path + '&preview-url=/' + path;
      html += '<li class="list-group-item" >' +
      '<a href="/' + edit_path + '"><span class="glyphicon glyphicon-edit"></span></a> ' +
      '<a href="/' + path + '">' + path + '</a></li>';
    });
    html += '</ul>';
    return html;
  }
}var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    fwidgets = forms.widgets,
    fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

functions.ruleToJS = function(rule) {
  var eventName = Object.keys(rule.event)[0];
  var eventInput = rule.event[eventName];
  var event = new cms.events[eventName](eventInput);
  var script = '';
  var head = '';
  var deps = [];
  _.each(rule.actions, function(action, index) {
    var name = Object.keys(action)[0];
    var input = action[name];
    var actionObject = new cms.actions[name](input);
    script += actionObject.toJS();
    head += actionObject.head ? actionObject.head() : '';
    if (actionObject.deps) {
      dextend(deps, actionObject.deps());
    }
  });

  head += event.head ? event.head() : '';

  return [event.toJS(script), deps];
}

functions.processRules = function(rules, callback) {
  var script = '';
  var head = '';
  var deps = {};
  _.each(rules, function(rule, index) {
    results = cms.functions.ruleToJS(rule);
    script += results[0];
    //head += results[1];
    dextend(deps, results[1]);
  });
  callback(script, deps);
}


events.load = function (input) {
  this.toJS = function(code) {
    return code
  }
}

events.clicked = function(input) {
  sel = input.sel;

  this.input = function() {
    return  {
      "sel:field_text" : {"label" : "CSS Selector", "value" : input.sel},
    };
  }

  this.toJS = function(code) {
    return '$("' + sel + '").on( "click", function() {' + code + '});'
  } 
}

actions.refresh = function(input) {
  this.toJS = function() {
    return 'location.reload();';
  }
}

actions.execute = function(input) {
  this.toJS = function() {
    return input.js;
  }
}

actions.alert = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'alert("' + message + '");';
  }
}

actions.message = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'toastr.info("' + message + '");';
  }

  this.deps = function() {
    return {'toastr': []};
  }
}


widgets.rule_page_editor = function(input) {
  var page = input.page;

  this.children = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      var jdata = JSON.parse(data);
      var state = jdata[0];
      var rules = jdata[1];
      var state2 = {};

      _.each(rules, function(rule, index) {
        state2['r' + index + ':' + 'rule_settings'] = rule;
      });

      callback({'body' : state2 });
    }); 
  }

  this.deps = function() {
    return {'jquery-ui': []};
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

widgets.rule_settings = function(input, id) {
  var rule = input;

  this.children = function(callback) {
    var c = {};

    c['e:rule_event_settings'] = rule.event;
    _.each(rule.actions, function(action, index) {
      c['a' + index + ':rule_action_settings'] = action;
    });

    callback({'body' : c});
  }

  this.toHTML = function(zones) {
    return '<div class="well">' + (zones['body'] || '') + '</div>';
  }
}

widgets.rule_event_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var eventInstance = new cms.events[type](input[type]);
    callback(eventInstance.input ? {'body' : eventInstance.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}


widgets.rule_action_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var action = new cms.actions[type](input[type]);
    callback(action.input ? {'body' : action.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    path = require('path'),
    dextend = require('dextend');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

functions.organizeState = function(state, callback) {
  var widgets_buffer = {};
  var count = 1;

  var initializeWidget = function(w, id) {
    var name = w.type;
    if (cms.widgets[name]) {
      var widget = new cms.widgets[name](w, id);
      widget.id = id;
    } else {
      console.log('Missing widget:' + name);
    }
    widget.all_children = {};

    if (widget.children) {
      count++;
      widget.children(function(children) {
        _.each(children, function(widgetStateList, zone) {
          var heirarchical = false;
          _.each(widgetStateList, function(widgetInput, idC) {
            var nameC = widgetInput.type;
            if (idC == 'start') {
              idC = id + 'inner-' + idC;
              key = idC + ':' + nameC;
            }
            if (!heirarchical) {
              w.slots = w.slots || {};
              w.slots[zone] = w.slots[zone] || [];
              w.slots[zone].push(idC);
            }
            if (partsC[0] == 'start') {
              heirarchical = true;
            }
            state[key] = widgetInput;

            initializeWidget(widgetInput, key);
          });
        });
        count--;
        part2();
      });
    }

    widgets_buffer[id] = widget;
    return widget;
  }

  //initialize each widget
  _.each(state, function(w, key) {
    initializeWidget(w, key)
  });

  count--;
  part2();

  function part2() {
    if (count != 0)
      return;

    //console.log(state);

    //connect the children to the parents
    _.each(state, function(w, id) {
      var widget = widgets_buffer[id];

      if (w.slots) {
        addChildrenToWidget(w.slots, widget);
      }
    });

    callback(widgets_buffer);
  }

  function addChildrenToWidget(zones, widget) {
    _.each(zones, function(widgetList, slot) {
      if (!widget.all_children[slot]) {
        widget.all_children[slot] = [];
      }
      _.each(widgetList, function(sub_id, i) {
        var sub = widgets_buffer[sub_id];
        if (typeof sub !== 'undefined') {
          widget.all_children[slot].push(sub);
          sub.parent = widget;
        } else {
          console.log('Invalid widget reference:' + sub_id);
        }
      });
    });
  }
}

functions.splitAndFill = function(state, values) {
  return cms.functions.fillValues(state, cms.functions.splitValues(values));
}

functions.splitValues = function(values) {
  var widgetValues = {};

  _.each(values, function(value, key) {
    var parts = key.split("-");
    if (parts.length == 2) {
      var widget_id = parts[0];
      var value_id = parts[1];

      if (!widgetValues[widget_id]) {
        widgetValues[widget_id] = {};
      }

      widgetValues[widget_id][value_id] = value;
    }
  });

  return widgetValues;
}

functions.fillValues = function(state, values) {
  _.each(state, function(w, id) {
    if (values[id]) {
      state[id] = _.extend(w, values[id]);
    }
  });

  return state;
}

functions.renderState = function(state, slotAssignments, callback, head_additional, deps) {
  cms.functions.renderStateParts(state, slotAssignments, function(html, deps, head, script) {
    var all_head = [];
    all_head = all_head.concat(head);
    all_head = all_head.concat(cms.functions.processDeps(deps));
    all_head.push('<script>$(function() {' + script + '});</script>');
    callback(html, all_head);
  });
}

functions.renderStateParts = function(state, slotAssignments, callback, values) {
  var head = [];
  var head_map = {};
  var script = '';

  var initial_values = values || {};

  cms.functions.organizeState(state, function(widgets_buffer) {
    loadAndPrepare(widgets_buffer);
  });

  function toHTML(widget, values) {
    if (widget.head) {
      _.each(widget.head(), function(head_element) {
        if (!(head_element in head_map)) {
          head_map[head_element] = true;
          head.push(head_element);
        }
      });
    }
    if (widget.script) {
      script += widget.script(widget.name);
    }
    if (widget.values) {
      _.extend(values, widget.values());
    }

    var zones = {};
    if (widget.zones) {
      _.each(widget.zones(), function(zone) {
        zones[zone] = '';
      });
    }

    _.each(widget.all_children, function(widgetList, zone) {
      var zone_html = '';

      _.each(widgetList, function(w, i) {
        zone_html += toHTML(w, values);
      });

      zones[zone] = zone_html;
    });

    var widget_html = '';
    if (widget.toHTML) {
      widget_html = widget.toHTML(zones, values[widget.id]);
    } else {
      _.each(zones, function(zone_html) {
        widget_html += zone_html;
      });
    }

    if (widget.isPage) {
      return widget_html;
    } else {
      return '<div class="widget-container widget-' + widget.name + '" id="' + widget.name + '">' + widget_html + '</div>';
    }
  }

  function loadAndPrepare(widgets_buffer) {
    var deps = {};

    async.each(Object.keys(widgets_buffer), function(id, callback) {
      var widget = widgets_buffer[id];
      if (widget.deps) {
        dextend(deps, widget.deps());
      }
      if (widget.load)
        widget.load(callback);
      else
        callback();
    }, function(err, results) {
      var html = '';
      _.each(slotAssignments['body'], function(id, index) {
        if (widgets_buffer[id]) {
          html += toHTML(widgets_buffer[id], initial_values);
        } else {
          console.log("Widget missing " + id);
        }
      });

      callback(html, deps, head, script);
    });
  }
}

widgets.state_editor = function (input, id) {
  var page = input.page || 'test';

  this.script = function() {
    return '$("input[type=\'submit\']").click(exportState);';
  }

  this.head = function() {
    return ['<script src="/modules/pages/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/pages/state-editor.css" />']
  }

  this.deps = function() {
    return {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};
  }

  this.toHTML = function(zones, value) {
    var v = JSON.stringify(value);
    return '<script type="text/javascript">var page = "'+ page + '"; var state = ' + v + ';</script>' +
    '<textarea style="display:none;" name="state">' + v + '</textarea>' +
    '<div ng-app><ul id="state-ctrl" ng-controller="stateController">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/pages/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/pages/widget.html\'"></li>' +
    '</div>';
  }
}var path = require('path'),
    _ = require('underscore'),
    fs = require('fs'),
    dive = require('dive'),
    mkdirp = require('mkdirp');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets; 
var functions = module.exports.functions;

functions.pageToStatic = function(fpath) {
  fs.readFile('pages/' + fpath + '.json', 'utf8', function(err, data) {
    if (err) {
      console.trace("Here I am!")
      return console.log(err);
    }
    console.log('static: ' + fpath);
    var jdata = JSON.parse(data);
    var state = jdata[0];
    var rules = jdata[1];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>'
      console.log('- ' + fpath);
      cms.functions.renderState(state, {}, function(html) {
        mkdirp(path.dirname('static/' + fpath), function(err) { 
          fs.writeFile('static/' + fpath  + '.html', html);
        });
      }, script, deps); //'<base href="http://localhost:3000/" target="_blank" >'
    });
  });
}

functions.allPagesToStatic = function() {
  dive('pages', {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative('pages',file).slice(0, -ext.length);
    if (ext == '.json') {
      cms.functions.pageToStatic(pa);
    }
  });
}

//http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
functions.copyFile = function(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

functions.staticThemeCopy = function() {
  var theme = 'themes/html5up-tessellate/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    mkdirp(path.dirname('static/' + pa), function(err) { 
      cms.functions.copyFile(file, 'static/' + pa, function() {

      });
    });
  });
}

functions.staticModulesCopy = function() {
  var theme = 'modules/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    if (ext == '.css' || ext == '.js' && pa.substr(pa.length - 4) != 'm.js') {
      mkdirp(path.dirname('static/' + pa), function(err) { 
        cms.functions.copyFile(file, 'static/' + pa, function() {

        });
      });
    }
  });
}var fs = require('fs'),
    _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets;

var copy = function (original) {
  return Object.keys(original).reduce(function (copy, key) {
      copy[key] = original[key];
      return copy;
  }, {});
}

widgets.json = function(input) {
  var file = input.file;
  var dir = input.dir || 'storage';
  var widget = input.widget || 'json'
  var values;

  this.deps = function() {
    return {'jquery' : []};
  }

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="file" value="' + file + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones['form'] + 
    '</form>';
  }

  this.load = function(callback) {
    fs.readFile(dir + '/' + file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      values = JSON.parse(data);
      callback();
    });
  }

  this.values = function() {
    return values;
  }

  this.save = function(values) {
    console.log(values);
    delete values['file'];
    fs.writeFile(dir + '/' + file + '.json', JSON.stringify(values, null, 4));
  }
}

widgets.ijson = function(input) {
  var dir = input.dir || 'storage/survey';
  var widget = input.widget || 'ijson'
  var values;

  this.deps = function() {
    return {'jquery' : []};
  }

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="id" value="' + input.id + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones['form'] + 
    '</form>';
  }

  this.load = function(callback) {
    if (typeof input.id !== 'undefined' && input.id != 'undefined') {
      fs.readFile(dir + '/' + (input.id) + '.json', 'utf8', function(err, data) {
        if (err) {
          console.trace("Here I am!")
          return console.log(err);
        }
        values = JSON.parse(data);
        console.log(values);
        callback();
      });
    } else {
      callback();
    }
    
  }

  this.values = function() {
    return values;
  }

  this.save = function(values) {
    console.log('-------');
    delete values['file'];
    delete values['dir'];
    var id = (typeof values.id !== 'undefined' && values.id != 'undefined') ? values.id : (widgets.ijson.counter++);
    delete values['id'];
    fs.writeFile(dir + '/' + id  + '.json', JSON.stringify(values, null, 4));
  }
}
widgets.ijson.init = function() {
  widgets.ijson.counter = 0;
  var files = fs.readdirSync('storage/survey');
  _.each(files, function(file) {
    var current = parseInt(file.split('.')[0]);
    if (current > widgets.ijson.counter) {
      widgets.ijson.counter = current + 1
    }
  });
}

widgets.pagejson = function(input) {
  input.widget = 'pagejson';
  var f = new widgets.json(input);

  f.save  = function(values) {
    var widgetValues = cms.m.pages.functions.splitValues(values);

    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        console.log(err);
      }
      var jdata = JSON.parse(data);
      jdata.widgets = cms.m.pages.functions.fillValues(jdata.widgets, widgetValues);
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata.widgets, null, 4));
    });
  }

  return f;
}

widgets.statejson = function(input) {
  input.widget = 'statejson';
  var f = new widgets.json(input);
  var current_state;

  f.load = function(callback) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.log("JSON file doesn't exist");
        current_state = {};
        //console.log(err);
        callback();
        return;
      }
      var jdata = JSON.parse(data);
      current_state = jdata;
      callback();
    });
  }

  f.values = function() {
    return {'editor': current_state};
  }

  f.save  = function(values) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      var jdata;
      if (err) {
        console.log("JSON file doesn't exist")
        //console.log(err);
        jdata = {};
      } else {
        jdata = JSON.parse(data);
      }
      var newData = JSON.parse(values['state']);
      jdata.widgets = newData.widgets;
      jdata.slotAssignments = newData.slotAssignments;
      console.log(newData);
      console.log(JSON.stringify(jdata));
      console.log(input.dir + '/' + input.file + '.json');
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata, null, 4));
    });
  }

  return f;
}var fs = require('fs'),
    Handlebars = require("handlebars");

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.template = function(input) {
  var that = this;
  this.path = input.path;

  this.zones = function() {
    {name : 'body'};
  }

  this.isPage = function() {
    return true;
  }

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = Handlebars.compile(data);
      callback();
    });
  }

  this.toHTML = function(zones) {
    return this.template(zones);
  }
}

widgets.htmlfile = function(input) {
  var that = this;
  this.path = input.path;

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = data;
      callback();
    });
  }

  this.toHTML = function() {
    return this.template;
  }
}

widgets.centered = function() {
  this.zones = function() {
    return ['content'];
  }

  this.toHTML = function(zones) {
    var template = Handlebars.compile('<div style="margin-left: auto; width: 700px; margin-right: auto; border: 1px solid black; border-radius: 10px; padding: 15px; ">' + 
    ' {{{ content }}} </div>');
    return template(zones);
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.login = function() {
  this.children = function(callback) {
    /*var state = {"start:htmlfile": {
        "path": "login.html"
    }};*/
    var state = {
        "start:form": {'widget': 'login','zones': {'form': ["username", "password", "save"]}},
        "username:field_text" : {"label": "Username"},
        "password:field_text" : {"label": "Password"},
        "save:submit" : {"label": "Login"},
    };
    callback({'body': state});
  }

  this.save = function(values) {
    console.log(values);
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

passport.use(new LocalStrategy(
  function(username, password, done) {
    /*User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });*/
    if (username == 'thomas')
      return done(null, user);
    else
      return done(null, false, { message: 'Incorrect username.' });
  }
));var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets,
    _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.two_col = function(input) {
  this.col1 = input.col1 || 6;
  this.col2 = input.col2 || 6;

  this.form = function() {
    return  {
      "col1" : {"type": "field_text", "label" : "Col 1 Width", "value" : this.col1},
      "col2" : {"type": "field_text", "label" : "Col 2 Width", "value" : this.col2}
    };
  }

  this.deps = function() {
    return {'jquery':[],'bootstrap': []};
  }

  this.toHTML = function(zones) {
    return '<div class="row"><div class="col-sm-' + this.col1 + '">' + zones['left'] + 
      '</div><div class="col-sm-' + this.col2 + '">' + zones['right'] + '</div></div>';
  }

  this.zones = function() {
    return ['left', 'right'];
  }
}

widgets.widget_selector = function (input, id) {
  var children = [];
  var html;

  this.deps = function() {
    return {'select2': []};
  }

  this.load = function(callback) {
    html = '<select class="widget-selector" style="display: none; width: 300px;">'
    html += '<option value="">- Select Widget -</option>'

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
      html += '<option value="' + w.name + '" data-form=\'' + (w.form ? true : false) + '\' data-zones=\''+ (w.zones ? JSON.stringify(w.zones()) : []) +'\'>' + w.name + '</option>'
    });

    html += '</select>';

    callback();
  }


  this.script = function() {
    return '$(".widget-selector").select2();';
  }

  this.toHTML = function(zones, value) {
    return html;
  }
}

widgets.widget_exporter = function(input) {
  var type = input.type || 'state_editor';
  var widget_input = {};
  var show_form = input.show_form || false;
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  if (input.input) {
    widget_input = JSON.parse(input.input);
  }
  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.isPage = function() {
    return true;
  }

  this.load = function(callback) {
    var viewReady = function(html, content_type, deps, head, javascript) {
      var all_head = [];
      all_head = all_head.concat(head);
      all_head = all_head.concat(cms.functions.processDeps(deps));
      _html = html;
      _head = all_head;
      _script = javascript;
      callback();
    }

    var state = false;

    if (show_form) {
      widget = new cms.widgets[type](values);
      if (widget.input) {
        state = widget.input();
      } else {
        error = 'Widget does not have a form';
      }
    } else {
      widget_input['type'] = type;
      state = {
        "start" : widget_input
      };
    }

    if (state) {
      cms.functions.renderStateParts(state, ['start'], viewReady);
    } else {
      callback();
    }
  }

  this.toHTML = function() {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    var out = {};
    var widget = cms.widgets[type];
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }
}

widgets.page_widget_form = function(input) {
  var widget_input = {};
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  if (input.input) {
    widget_input = JSON.parse(input.input);
  }
  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.isPage = function() {
    return true;
  }

  this.load = function(callback) {
    var viewReady = function(html, deps, head, javascript) {
      var all_head = [];
      console.log(html);
      all_head = all_head.concat(head);
      all_head = all_head.concat(cms.functions.processDeps(deps));
      _html = html;
      _head = all_head;
      _script = javascript;
      callback();
    }

    var state = false;

    fs.readFile('pages' + '/' + input.widget_page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace('JSON missing');
      }

      var jdata = JSON.parse(data);
      var widget_input = jdata.widgets[input.widget_id];

      widget = new cms.widgets[input.widget_type](widget_input);
      if (widget.form) {
        state = widget.form();
      } else {
        error = 'Widget does not have a form';
      }

      console.log(state);
      console.log(_.keys(state));

      if (state) {
        cms.functions.renderStateParts(state, {'body': _.keys(state) }, viewReady, widget_input);
      } else {
        callback();
      }
    });
  }

  this.toHTML = function(zones) {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    console.log('123');

    var out = {};
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }

  this.save = function(values) {
    fs.readFile('pages' + '/' + values.widget_page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("JSON file doesn't exist")
        console.log(err);
        return false
      }
      var jdata = JSON.parse(data);

      var page = values.widget_page;
      var id = values.widget_id;
      var type = values.widget_type;
      delete values['widget_page'];
      delete values['widget_id'];
      delete values['widget_type'];
        
      jdata.widgets[id] = values;
      jdata.widgets[id].type = type;
      fs.writeFile('pages' + '/' + page + '.json', JSON.stringify(jdata, null, 4));
      console.log('updated state of ' + page);
      console.log(values);
    });
  }
}var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

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

widgets.calendar = function() {
  this.deps = function() {
    return {'jquery': [], 'jquery-ui': [], 'fullcalendar': ['fullcalendar.min.js','fullcalendar.css']};
  }

  this.script = function() {
    return "$('#fcalendar').fullCalendar({ header: { left: 'prev,next today', center: 'title', " + 
      "right: 'month,agendaWeek,agendaDay' }, editable: true});";
  }

  this.toHTML = function() {
    return '<div id="fcalendar"></div>';
  }
}var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
functions = module.exports.functions;

functions.processDeps = function(deps) {
  if (!deps) {
    return '';
  }
  var order = deps['order'];
  delete deps['order'];
  order = _.union(order, Object.keys(deps));
  var head = [];
  _.each(order, function(dep, index) {
    var depFiles = _.union(cms.deps[dep], deps[dep]);
    head.push(cms.functions.processDep(dep, depFiles));
  });

  return head;
}

functions.processDep = function(dep, depFiles) {
  var folder = 'bower_components/' + dep + '/';

  var html = '';
  _.each(depFiles, function(file, index) {
    if (file) {
      html += cms.functions.fileToHTML('/' + folder, file);
    }
  });
  return html;
}

functions.fileToHTML = function(folder, file) {
  if (!file || typeof file !== 'string') {
    console.log('invalid dependency:' + folder + ' ' + JSON.stringify(file));
    return;
  }
  var ext = file.split('.').pop();
  var full = folder + file;
  if (ext == 'js') {
    return '<script type="text/javascript" src="' + full + '"></script>';
  } else if (ext == 'css') {
    return '<link rel="stylesheet" href="' + full + '" />';
  } else {
    return '';
  }
}var forms = require('forms'),
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
var fs = require('fs'),
    url = require('url'),
    _ = require('underscore');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

widgets.site_log = function(input) {
  this.head = function() {
    return ['<script src="/socket.io/socket.io.js"></script>',
      '<script src="/modules/log/site_log.js" type="text/javascript"></script>']
  }

  this.toHTML = function() {
    return '<h2>Site Activity</h2><div id="log"></div>';
  }
}

functions.log = function(type, message, data) {
  console.log(type);
}module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.youtube_video = function (input) {
  this.form = function() {
    return  {
      "id" : {"name": "id", "type": "field_text", "label" : "Video ID", "value" : input.id}
    };
  }

  this.toHTML = function() {
    return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + input.id + '" frameborder="0" allowfullscreen></iframe>';
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require("handlebars");

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

var page_template;

fs.readFile('page.html', 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  page_template = Handlebars.compile(data);
});

functions.viewPage = function(path, vars, callback, error_callback) {
  if (path == '/') {
    path = 'index'
  }
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      //console.log(err);
      error_callback();
      return;
    }
    var jdata = JSON.parse(data);
    var state = jdata.widgets;
    var slotAssignments = jdata.slotAssignments;
    var rules = jdata.rules || [];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>';
      state = cms.functions.splitAndFill(state, vars);

      if ('json' in vars) {
          var json = JSON.stringify(state, null, 4);
          //json = json.replace(/\n/g,'</br>');
          //json = json.replace(/\s+/gm, function(spaces) { return spaces.replace(/./g, '&nbsp;'); } );
          callback(json, 'text/javascript');
      } else {
        cms.functions.renderState(state, slotAssignments, function(html, head) {
          var content_type = jdata.contentType ? jdata.contentType : 'text/html';

          if (content_type == 'text/html') {
            var encoded_head = JSON.stringify(head);
            encoded_head = encoded_head.replace(/<\/script/g, '</scr"+"ipt');
            var head_meta = '<script type="text/javascript">var head = ' + encoded_head + ';</script>';
            head.push(head_meta);
            var html = page_template({
              'head': head.join('\n') + script,
              'body': html
            });
          }
          callback(html, content_type);
        }, script, deps);
      }
    });
  });
}

widgets.echo = function(input) {
}

widgets.page_listing = function(input) {
  var paths = [];

  this.load = function(callback) {
    dive('pages', {}, function(err, file) {
      var pa = path.relative('pages',file).slice(0, -5);
      var ext = path.extname(file);
      if (ext == '.json') {
        paths.push(pa);
      }
    }, callback);
  }

  this.toHTML = function() {
    var html = '<h1>Pages</h1><ul class="list-group">';
    _.each(paths, function(path, index) {
      var edit_path = 'admin/pages/edit?storage-file=' + path + '&editor-page=' + path + '&preview-url=/' + path;
      html += '<li class="list-group-item" >' +
      '<a href="/' + edit_path + '"><span class="glyphicon glyphicon-edit"></span></a> ' +
      '<a href="/' + path + '">' + path + '</a></li>';
    });
    html += '</ul>';
    return html;
  }
}var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    fwidgets = forms.widgets,
    fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

functions.ruleToJS = function(rule) {
  var eventName = Object.keys(rule.event)[0];
  var eventInput = rule.event[eventName];
  var event = new cms.events[eventName](eventInput);
  var script = '';
  var head = '';
  var deps = [];
  _.each(rule.actions, function(action, index) {
    var name = Object.keys(action)[0];
    var input = action[name];
    var actionObject = new cms.actions[name](input);
    script += actionObject.toJS();
    head += actionObject.head ? actionObject.head() : '';
    if (actionObject.deps) {
      dextend(deps, actionObject.deps());
    }
  });

  head += event.head ? event.head() : '';

  return [event.toJS(script), deps];
}

functions.processRules = function(rules, callback) {
  var script = '';
  var head = '';
  var deps = {};
  _.each(rules, function(rule, index) {
    results = cms.functions.ruleToJS(rule);
    script += results[0];
    //head += results[1];
    dextend(deps, results[1]);
  });
  callback(script, deps);
}


events.load = function (input) {
  this.toJS = function(code) {
    return code
  }
}

events.clicked = function(input) {
  sel = input.sel;

  this.input = function() {
    return  {
      "sel:field_text" : {"label" : "CSS Selector", "value" : input.sel},
    };
  }

  this.toJS = function(code) {
    return '$("' + sel + '").on( "click", function() {' + code + '});'
  } 
}

actions.refresh = function(input) {
  this.toJS = function() {
    return 'location.reload();';
  }
}

actions.execute = function(input) {
  this.toJS = function() {
    return input.js;
  }
}

actions.alert = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'alert("' + message + '");';
  }
}

actions.message = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'toastr.info("' + message + '");';
  }

  this.deps = function() {
    return {'toastr': []};
  }
}


widgets.rule_page_editor = function(input) {
  var page = input.page;

  this.children = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      var jdata = JSON.parse(data);
      var state = jdata[0];
      var rules = jdata[1];
      var state2 = {};

      _.each(rules, function(rule, index) {
        state2['r' + index + ':' + 'rule_settings'] = rule;
      });

      callback({'body' : state2 });
    }); 
  }

  this.deps = function() {
    return {'jquery-ui': []};
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

widgets.rule_settings = function(input, id) {
  var rule = input;

  this.children = function(callback) {
    var c = {};

    c['e:rule_event_settings'] = rule.event;
    _.each(rule.actions, function(action, index) {
      c['a' + index + ':rule_action_settings'] = action;
    });

    callback({'body' : c});
  }

  this.toHTML = function(zones) {
    return '<div class="well">' + (zones['body'] || '') + '</div>';
  }
}

widgets.rule_event_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var eventInstance = new cms.events[type](input[type]);
    callback(eventInstance.input ? {'body' : eventInstance.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}


widgets.rule_action_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var action = new cms.actions[type](input[type]);
    callback(action.input ? {'body' : action.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    path = require('path'),
    dextend = require('dextend');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

functions.organizeState = function(state, callback) {
  var widgets_buffer = {};
  var count = 1;

  var initializeWidget = function(w, id) {
    var name = w.type;
    if (cms.widgets[name]) {
      var widget = new cms.widgets[name](w, id);
      widget.id = id;
    } else {
      console.log('Missing widget:' + name);
    }
    widget.all_children = {};

    if (widget.children) {
      count++;
      widget.children(function(children) {
        _.each(children, function(widgetStateList, zone) {
          var heirarchical = false;
          _.each(widgetStateList, function(widgetInput, idC) {
            var nameC = widgetInput.type;
            if (idC == 'start') {
              idC = id + 'inner-' + idC;
              key = idC + ':' + nameC;
            }
            if (!heirarchical) {
              w.slots = w.slots || {};
              w.slots[zone] = w.slots[zone] || [];
              w.slots[zone].push(idC);
            }
            if (partsC[0] == 'start') {
              heirarchical = true;
            }
            state[key] = widgetInput;

            initializeWidget(widgetInput, key);
          });
        });
        count--;
        part2();
      });
    }

    widgets_buffer[id] = widget;
    return widget;
  }

  //initialize each widget
  _.each(state, function(w, key) {
    initializeWidget(w, key)
  });

  count--;
  part2();

  function part2() {
    if (count != 0)
      return;

    //console.log(state);

    //connect the children to the parents
    _.each(state, function(w, id) {
      var widget = widgets_buffer[id];

      if (w.slots) {
        addChildrenToWidget(w.slots, widget);
      }
    });

    callback(widgets_buffer);
  }

  function addChildrenToWidget(zones, widget) {
    _.each(zones, function(widgetList, slot) {
      if (!widget.all_children[slot]) {
        widget.all_children[slot] = [];
      }
      _.each(widgetList, function(sub_id, i) {
        var sub = widgets_buffer[sub_id];
        if (typeof sub !== 'undefined') {
          widget.all_children[slot].push(sub);
          sub.parent = widget;
        } else {
          console.log('Invalid widget reference:' + sub_id);
        }
      });
    });
  }
}

functions.splitAndFill = function(state, values) {
  return cms.functions.fillValues(state, cms.functions.splitValues(values));
}

functions.splitValues = function(values) {
  var widgetValues = {};

  _.each(values, function(value, key) {
    var parts = key.split("-");
    if (parts.length == 2) {
      var widget_id = parts[0];
      var value_id = parts[1];

      if (!widgetValues[widget_id]) {
        widgetValues[widget_id] = {};
      }

      widgetValues[widget_id][value_id] = value;
    }
  });

  return widgetValues;
}

functions.fillValues = function(state, values) {
  _.each(state, function(w, id) {
    if (values[id]) {
      state[id] = _.extend(w, values[id]);
    }
  });

  return state;
}

functions.renderState = function(state, slotAssignments, callback, head_additional, deps) {
  cms.functions.renderStateParts(state, slotAssignments, function(html, deps, head, script) {
    var all_head = [];
    all_head = all_head.concat(head);
    all_head = all_head.concat(cms.functions.processDeps(deps));
    all_head.push('<script>$(function() {' + script + '});</script>');
    callback(html, all_head);
  });
}

functions.renderStateParts = function(state, slotAssignments, callback, values) {
  var head = [];
  var head_map = {};
  var script = '';

  var initial_values = values || {};

  cms.functions.organizeState(state, function(widgets_buffer) {
    loadAndPrepare(widgets_buffer);
  });

  function toHTML(widget, values) {
    if (widget.head) {
      _.each(widget.head(), function(head_element) {
        if (!(head_element in head_map)) {
          head_map[head_element] = true;
          head.push(head_element);
        }
      });
    }
    if (widget.script) {
      script += widget.script(widget.name);
    }
    if (widget.values) {
      _.extend(values, widget.values());
    }

    var zones = {};
    if (widget.zones) {
      _.each(widget.zones(), function(zone) {
        zones[zone] = '';
      });
    }

    _.each(widget.all_children, function(widgetList, zone) {
      var zone_html = '';

      _.each(widgetList, function(w, i) {
        zone_html += toHTML(w, values);
      });

      zones[zone] = zone_html;
    });

    var widget_html = '';
    if (widget.toHTML) {
      widget_html = widget.toHTML(zones, values[widget.id]);
    } else {
      _.each(zones, function(zone_html) {
        widget_html += zone_html;
      });
    }

    if (widget.isPage) {
      return widget_html;
    } else {
      return '<div class="widget-container widget-' + widget.name + '" id="' + widget.name + '">' + widget_html + '</div>';
    }
  }

  function loadAndPrepare(widgets_buffer) {
    var deps = {};

    async.each(Object.keys(widgets_buffer), function(id, callback) {
      var widget = widgets_buffer[id];
      if (widget.deps) {
        dextend(deps, widget.deps());
      }
      if (widget.load)
        widget.load(callback);
      else
        callback();
    }, function(err, results) {
      var html = '';
      _.each(slotAssignments['body'], function(id, index) {
        if (widgets_buffer[id]) {
          html += toHTML(widgets_buffer[id], initial_values);
        } else {
          console.log("Widget missing " + id);
        }
      });

      callback(html, deps, head, script);
    });
  }
}

widgets.state_editor = function (input, id) {
  var page = input.page || 'test';

  this.script = function() {
    return '$("input[type=\'submit\']").click(exportState);';
  }

  this.head = function() {
    return ['<script src="/modules/pages/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/pages/state-editor.css" />']
  }

  this.deps = function() {
    return {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};
  }

  this.toHTML = function(zones, value) {
    var v = JSON.stringify(value);
    return '<script type="text/javascript">var page = "'+ page + '"; var state = ' + v + ';</script>' +
    '<textarea style="display:none;" name="state">' + v + '</textarea>' +
    '<div ng-app><ul id="state-ctrl" ng-controller="stateController">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/pages/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/pages/widget.html\'"></li>' +
    '</div>';
  }
}var path = require('path'),
    _ = require('underscore'),
    fs = require('fs'),
    dive = require('dive'),
    mkdirp = require('mkdirp');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets; 
var functions = module.exports.functions;

functions.pageToStatic = function(fpath) {
  fs.readFile('pages/' + fpath + '.json', 'utf8', function(err, data) {
    if (err) {
      console.trace("Here I am!")
      return console.log(err);
    }
    console.log('static: ' + fpath);
    var jdata = JSON.parse(data);
    var state = jdata[0];
    var rules = jdata[1];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>'
      console.log('- ' + fpath);
      cms.functions.renderState(state, {}, function(html) {
        mkdirp(path.dirname('static/' + fpath), function(err) { 
          fs.writeFile('static/' + fpath  + '.html', html);
        });
      }, script, deps); //'<base href="http://localhost:3000/" target="_blank" >'
    });
  });
}

functions.allPagesToStatic = function() {
  dive('pages', {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative('pages',file).slice(0, -ext.length);
    if (ext == '.json') {
      cms.functions.pageToStatic(pa);
    }
  });
}

//http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
functions.copyFile = function(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

functions.staticThemeCopy = function() {
  var theme = 'themes/html5up-tessellate/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    mkdirp(path.dirname('static/' + pa), function(err) { 
      cms.functions.copyFile(file, 'static/' + pa, function() {

      });
    });
  });
}

functions.staticModulesCopy = function() {
  var theme = 'modules/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    if (ext == '.css' || ext == '.js' && pa.substr(pa.length - 4) != 'm.js') {
      mkdirp(path.dirname('static/' + pa), function(err) { 
        cms.functions.copyFile(file, 'static/' + pa, function() {

        });
      });
    }
  });
}var fs = require('fs'),
    _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets;

var copy = function (original) {
  return Object.keys(original).reduce(function (copy, key) {
      copy[key] = original[key];
      return copy;
  }, {});
}

widgets.json = function(input) {
  var file = input.file;
  var dir = input.dir || 'storage';
  var widget = input.widget || 'json'
  var values;

  this.deps = function() {
    return {'jquery' : []};
  }

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="file" value="' + file + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones['form'] + 
    '</form>';
  }

  this.load = function(callback) {
    fs.readFile(dir + '/' + file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      values = JSON.parse(data);
      callback();
    });
  }

  this.values = function() {
    return values;
  }

  this.save = function(values) {
    console.log(values);
    delete values['file'];
    fs.writeFile(dir + '/' + file + '.json', JSON.stringify(values, null, 4));
  }
}

widgets.ijson = function(input) {
  var dir = input.dir || 'storage/survey';
  var widget = input.widget || 'ijson'
  var values;

  this.deps = function() {
    return {'jquery' : []};
  }

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="id" value="' + input.id + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones['form'] + 
    '</form>';
  }

  this.load = function(callback) {
    if (typeof input.id !== 'undefined' && input.id != 'undefined') {
      fs.readFile(dir + '/' + (input.id) + '.json', 'utf8', function(err, data) {
        if (err) {
          console.trace("Here I am!")
          return console.log(err);
        }
        values = JSON.parse(data);
        console.log(values);
        callback();
      });
    } else {
      callback();
    }
    
  }

  this.values = function() {
    return values;
  }

  this.save = function(values) {
    console.log('-------');
    delete values['file'];
    delete values['dir'];
    var id = (typeof values.id !== 'undefined' && values.id != 'undefined') ? values.id : (widgets.ijson.counter++);
    delete values['id'];
    fs.writeFile(dir + '/' + id  + '.json', JSON.stringify(values, null, 4));
  }
}
widgets.ijson.init = function() {
  widgets.ijson.counter = 0;
  var files = fs.readdirSync('storage/survey');
  _.each(files, function(file) {
    var current = parseInt(file.split('.')[0]);
    if (current > widgets.ijson.counter) {
      widgets.ijson.counter = current + 1
    }
  });
}

widgets.pagejson = function(input) {
  input.widget = 'pagejson';
  var f = new widgets.json(input);

  f.save  = function(values) {
    var widgetValues = cms.m.pages.functions.splitValues(values);

    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        console.log(err);
      }
      var jdata = JSON.parse(data);
      jdata.widgets = cms.m.pages.functions.fillValues(jdata.widgets, widgetValues);
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata.widgets, null, 4));
    });
  }

  return f;
}

widgets.statejson = function(input) {
  input.widget = 'statejson';
  var f = new widgets.json(input);
  var current_state;

  f.load = function(callback) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.log("JSON file doesn't exist");
        current_state = {};
        //console.log(err);
        callback();
        return;
      }
      var jdata = JSON.parse(data);
      current_state = jdata;
      callback();
    });
  }

  f.values = function() {
    return {'editor': current_state};
  }

  f.save  = function(values) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      var jdata;
      if (err) {
        console.log("JSON file doesn't exist")
        //console.log(err);
        jdata = {};
      } else {
        jdata = JSON.parse(data);
      }
      var newData = JSON.parse(values['state']);
      jdata.widgets = newData.widgets;
      jdata.slotAssignments = newData.slotAssignments;
      console.log(newData);
      console.log(JSON.stringify(jdata));
      console.log(input.dir + '/' + input.file + '.json');
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata, null, 4));
    });
  }

  return f;
}var fs = require('fs'),
    Handlebars = require("handlebars");

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.template = function(input) {
  var that = this;
  this.path = input.path;

  this.zones = function() {
    {name : 'body'};
  }

  this.isPage = function() {
    return true;
  }

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = Handlebars.compile(data);
      callback();
    });
  }

  this.toHTML = function(zones) {
    return this.template(zones);
  }
}

widgets.htmlfile = function(input) {
  var that = this;
  this.path = input.path;

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = data;
      callback();
    });
  }

  this.toHTML = function() {
    return this.template;
  }
}

widgets.centered = function() {
  this.zones = function() {
    return ['content'];
  }

  this.toHTML = function(zones) {
    var template = Handlebars.compile('<div style="margin-left: auto; width: 700px; margin-right: auto; border: 1px solid black; border-radius: 10px; padding: 15px; ">' + 
    ' {{{ content }}} </div>');
    return template(zones);
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.login = function() {
  this.children = function(callback) {
    /*var state = {"start:htmlfile": {
        "path": "login.html"
    }};*/
    var state = {
        "start:form": {'widget': 'login','zones': {'form': ["username", "password", "save"]}},
        "username:field_text" : {"label": "Username"},
        "password:field_text" : {"label": "Password"},
        "save:submit" : {"label": "Login"},
    };
    callback({'body': state});
  }

  this.save = function(values) {
    console.log(values);
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

passport.use(new LocalStrategy(
  function(username, password, done) {
    /*User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });*/
    if (username == 'thomas')
      return done(null, user);
    else
      return done(null, false, { message: 'Incorrect username.' });
  }
));var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets,
    _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.two_col = function(input) {
  this.col1 = input.col1 || 6;
  this.col2 = input.col2 || 6;

  this.form = function() {
    return  {
      "col1" : {"type": "field_text", "label" : "Col 1 Width", "value" : this.col1},
      "col2" : {"type": "field_text", "label" : "Col 2 Width", "value" : this.col2}
    };
  }

  this.deps = function() {
    return {'jquery':[],'bootstrap': []};
  }

  this.toHTML = function(zones) {
    return '<div class="row"><div class="col-sm-' + this.col1 + '">' + zones['left'] + 
      '</div><div class="col-sm-' + this.col2 + '">' + zones['right'] + '</div></div>';
  }

  this.zones = function() {
    return ['left', 'right'];
  }
}

widgets.widget_selector = function (input, id) {
  var children = [];
  var html;

  this.deps = function() {
    return {'select2': []};
  }

  this.load = function(callback) {
    html = '<select class="widget-selector" style="display: none; width: 300px;">'
    html += '<option value="">- Select Widget -</option>'

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
      html += '<option value="' + w.name + '" data-form=\'' + (w.form ? true : false) + '\' data-zones=\''+ (w.zones ? JSON.stringify(w.zones()) : []) +'\'>' + w.name + '</option>'
    });

    html += '</select>';

    callback();
  }


  this.script = function() {
    return '$(".widget-selector").select2();';
  }

  this.toHTML = function(zones, value) {
    return html;
  }
}

widgets.widget_exporter = function(input) {
  var type = input.type || 'state_editor';
  var widget_input = {};
  var show_form = input.show_form || false;
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  if (input.input) {
    widget_input = JSON.parse(input.input);
  }
  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.isPage = function() {
    return true;
  }

  this.load = function(callback) {
    var viewReady = function(html, content_type, deps, head, javascript) {
      var all_head = [];
      all_head = all_head.concat(head);
      all_head = all_head.concat(cms.functions.processDeps(deps));
      _html = html;
      _head = all_head;
      _script = javascript;
      callback();
    }

    var state = false;

    if (show_form) {
      widget = new cms.widgets[type](values);
      if (widget.input) {
        state = widget.input();
      } else {
        error = 'Widget does not have a form';
      }
    } else {
      widget_input['type'] = type;
      state = {
        "start" : widget_input
      };
    }

    if (state) {
      cms.functions.renderStateParts(state, ['start'], viewReady);
    } else {
      callback();
    }
  }

  this.toHTML = function() {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    var out = {};
    var widget = cms.widgets[type];
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }
}

widgets.page_widget_form = function(input) {
  var widget_input = {};
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  if (input.input) {
    widget_input = JSON.parse(input.input);
  }
  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.isPage = function() {
    return true;
  }

  this.load = function(callback) {
    var viewReady = function(html, deps, head, javascript) {
      var all_head = [];
      console.log(html);
      all_head = all_head.concat(head);
      all_head = all_head.concat(cms.functions.processDeps(deps));
      _html = html;
      _head = all_head;
      _script = javascript;
      callback();
    }

    var state = false;

    fs.readFile('pages' + '/' + input.widget_page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace('JSON missing');
      }

      var jdata = JSON.parse(data);
      var widget_input = jdata.widgets[input.widget_id];

      widget = new cms.widgets[input.widget_type](widget_input);
      if (widget.form) {
        state = widget.form();
      } else {
        error = 'Widget does not have a form';
      }

      console.log(state);
      console.log(_.keys(state));

      if (state) {
        cms.functions.renderStateParts(state, {'body': _.keys(state) }, viewReady, widget_input);
      } else {
        callback();
      }
    });
  }

  this.toHTML = function(zones) {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    console.log('123');

    var out = {};
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }

  this.save = function(values) {
    fs.readFile('pages' + '/' + values.widget_page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("JSON file doesn't exist")
        console.log(err);
        return false
      }
      var jdata = JSON.parse(data);

      var page = values.widget_page;
      var id = values.widget_id;
      var type = values.widget_type;
      delete values['widget_page'];
      delete values['widget_id'];
      delete values['widget_type'];
        
      jdata.widgets[id] = values;
      jdata.widgets[id].type = type;
      fs.writeFile('pages' + '/' + page + '.json', JSON.stringify(jdata, null, 4));
      console.log('updated state of ' + page);
      console.log(values);
    });
  }
}var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

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

widgets.calendar = function() {
  this.deps = function() {
    return {'jquery': [], 'jquery-ui': [], 'fullcalendar': ['fullcalendar.min.js','fullcalendar.css']};
  }

  this.script = function() {
    return "$('#fcalendar').fullCalendar({ header: { left: 'prev,next today', center: 'title', " + 
      "right: 'month,agendaWeek,agendaDay' }, editable: true});";
  }

  this.toHTML = function() {
    return '<div id="fcalendar"></div>';
  }
}var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
functions = module.exports.functions;

functions.processDeps = function(deps) {
  if (!deps) {
    return '';
  }
  var order = deps['order'];
  delete deps['order'];
  order = _.union(order, Object.keys(deps));
  var head = [];
  _.each(order, function(dep, index) {
    var depFiles = _.union(cms.deps[dep], deps[dep]);
    head.push(cms.functions.processDep(dep, depFiles));
  });

  return head;
}

functions.processDep = function(dep, depFiles) {
  var folder = 'bower_components/' + dep + '/';

  var html = '';
  _.each(depFiles, function(file, index) {
    if (file) {
      html += cms.functions.fileToHTML('/' + folder, file);
    }
  });
  return html;
}

functions.fileToHTML = function(folder, file) {
  if (!file || typeof file !== 'string') {
    console.log('invalid dependency:' + folder + ' ' + JSON.stringify(file));
    return;
  }
  var ext = file.split('.').pop();
  var full = folder + file;
  if (ext == 'js') {
    return '<script type="text/javascript" src="' + full + '"></script>';
  } else if (ext == 'css') {
    return '<link rel="stylesheet" href="' + full + '" />';
  } else {
    return '';
  }
}var forms = require('forms'),
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
var fs = require('fs'),
    url = require('url'),
    _ = require('underscore');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

widgets.site_log = function(input) {
  this.head = function() {
    return ['<script src="/socket.io/socket.io.js"></script>',
      '<script src="/modules/log/site_log.js" type="text/javascript"></script>']
  }

  this.toHTML = function() {
    return '<h2>Site Activity</h2><div id="log"></div>';
  }
}

functions.log = function(type, message, data) {
  console.log(type);
}module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.youtube_video = function (input) {
  this.form = function() {
    return  {
      "id" : {"name": "id", "type": "field_text", "label" : "Video ID", "value" : input.id}
    };
  }

  this.toHTML = function() {
    return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + input.id + '" frameborder="0" allowfullscreen></iframe>';
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require("handlebars");

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

var page_template;

fs.readFile('page.html', 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  page_template = Handlebars.compile(data);
});

functions.viewPage = function(path, vars, callback, error_callback) {
  if (path == '/') {
    path = 'index'
  }
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      //console.log(err);
      error_callback();
      return;
    }
    var jdata = JSON.parse(data);
    var state = jdata.widgets;
    var slotAssignments = jdata.slotAssignments;
    var rules = jdata.rules || [];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>';
      state = cms.functions.splitAndFill(state, vars);

      if ('json' in vars) {
          var json = JSON.stringify(state, null, 4);
          //json = json.replace(/\n/g,'</br>');
          //json = json.replace(/\s+/gm, function(spaces) { return spaces.replace(/./g, '&nbsp;'); } );
          callback(json, 'text/javascript');
      } else {
        cms.functions.renderState(state, slotAssignments, function(html, head) {
          var content_type = jdata.contentType ? jdata.contentType : 'text/html';

          if (content_type == 'text/html') {
            var encoded_head = JSON.stringify(head);
            encoded_head = encoded_head.replace(/<\/script/g, '</scr"+"ipt');
            var head_meta = '<script type="text/javascript">var head = ' + encoded_head + ';</script>';
            head.push(head_meta);
            var html = page_template({
              'head': head.join('\n') + script,
              'body': html
            });
          }
          callback(html, content_type);
        }, script, deps);
      }
    });
  });
}

widgets.echo = function(input) {
}

widgets.page_listing = function(input) {
  var paths = [];

  this.load = function(callback) {
    dive('pages', {}, function(err, file) {
      var pa = path.relative('pages',file).slice(0, -5);
      var ext = path.extname(file);
      if (ext == '.json') {
        paths.push(pa);
      }
    }, callback);
  }

  this.toHTML = function() {
    var html = '<h1>Pages</h1><ul class="list-group">';
    _.each(paths, function(path, index) {
      var edit_path = 'admin/pages/edit?storage-file=' + path + '&editor-page=' + path + '&preview-url=/' + path;
      html += '<li class="list-group-item" >' +
      '<a href="/' + edit_path + '"><span class="glyphicon glyphicon-edit"></span></a> ' +
      '<a href="/' + path + '">' + path + '</a></li>';
    });
    html += '</ul>';
    return html;
  }
}var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    fwidgets = forms.widgets,
    fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

functions.ruleToJS = function(rule) {
  var eventName = Object.keys(rule.event)[0];
  var eventInput = rule.event[eventName];
  var event = new cms.events[eventName](eventInput);
  var script = '';
  var head = '';
  var deps = [];
  _.each(rule.actions, function(action, index) {
    var name = Object.keys(action)[0];
    var input = action[name];
    var actionObject = new cms.actions[name](input);
    script += actionObject.toJS();
    head += actionObject.head ? actionObject.head() : '';
    if (actionObject.deps) {
      dextend(deps, actionObject.deps());
    }
  });

  head += event.head ? event.head() : '';

  return [event.toJS(script), deps];
}

functions.processRules = function(rules, callback) {
  var script = '';
  var head = '';
  var deps = {};
  _.each(rules, function(rule, index) {
    results = cms.functions.ruleToJS(rule);
    script += results[0];
    //head += results[1];
    dextend(deps, results[1]);
  });
  callback(script, deps);
}


events.load = function (input) {
  this.toJS = function(code) {
    return code
  }
}

events.clicked = function(input) {
  sel = input.sel;

  this.input = function() {
    return  {
      "sel:field_text" : {"label" : "CSS Selector", "value" : input.sel},
    };
  }

  this.toJS = function(code) {
    return '$("' + sel + '").on( "click", function() {' + code + '});'
  } 
}

actions.refresh = function(input) {
  this.toJS = function() {
    return 'location.reload();';
  }
}

actions.execute = function(input) {
  this.toJS = function() {
    return input.js;
  }
}

actions.alert = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'alert("' + message + '");';
  }
}

actions.message = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'toastr.info("' + message + '");';
  }

  this.deps = function() {
    return {'toastr': []};
  }
}


widgets.rule_page_editor = function(input) {
  var page = input.page;

  this.children = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      var jdata = JSON.parse(data);
      var state = jdata[0];
      var rules = jdata[1];
      var state2 = {};

      _.each(rules, function(rule, index) {
        state2['r' + index + ':' + 'rule_settings'] = rule;
      });

      callback({'body' : state2 });
    }); 
  }

  this.deps = function() {
    return {'jquery-ui': []};
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

widgets.rule_settings = function(input, id) {
  var rule = input;

  this.children = function(callback) {
    var c = {};

    c['e:rule_event_settings'] = rule.event;
    _.each(rule.actions, function(action, index) {
      c['a' + index + ':rule_action_settings'] = action;
    });

    callback({'body' : c});
  }

  this.toHTML = function(zones) {
    return '<div class="well">' + (zones['body'] || '') + '</div>';
  }
}

widgets.rule_event_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var eventInstance = new cms.events[type](input[type]);
    callback(eventInstance.input ? {'body' : eventInstance.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}


widgets.rule_action_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var action = new cms.actions[type](input[type]);
    callback(action.input ? {'body' : action.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    path = require('path'),
    dextend = require('dextend');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

functions.organizeState = function(state, callback) {
  var widgets_buffer = {};
  var count = 1;

  var initializeWidget = function(w, id) {
    var name = w.type;
    if (cms.widgets[name]) {
      var widget = new cms.widgets[name](w, id);
      widget.id = id;
    } else {
      console.log('Missing widget:' + name);
    }
    widget.all_children = {};

    if (widget.children) {
      count++;
      widget.children(function(children) {
        _.each(children, function(widgetStateList, zone) {
          var heirarchical = false;
          _.each(widgetStateList, function(widgetInput, idC) {
            var nameC = widgetInput.type;
            if (idC == 'start') {
              idC = id + 'inner-' + idC;
              key = idC + ':' + nameC;
            }
            if (!heirarchical) {
              w.slots = w.slots || {};
              w.slots[zone] = w.slots[zone] || [];
              w.slots[zone].push(idC);
            }
            if (partsC[0] == 'start') {
              heirarchical = true;
            }
            state[key] = widgetInput;

            initializeWidget(widgetInput, key);
          });
        });
        count--;
        part2();
      });
    }

    widgets_buffer[id] = widget;
    return widget;
  }

  //initialize each widget
  _.each(state, function(w, key) {
    initializeWidget(w, key)
  });

  count--;
  part2();

  function part2() {
    if (count != 0)
      return;

    //console.log(state);

    //connect the children to the parents
    _.each(state, function(w, id) {
      var widget = widgets_buffer[id];

      if (w.slots) {
        addChildrenToWidget(w.slots, widget);
      }
    });

    callback(widgets_buffer);
  }

  function addChildrenToWidget(zones, widget) {
    _.each(zones, function(widgetList, slot) {
      if (!widget.all_children[slot]) {
        widget.all_children[slot] = [];
      }
      _.each(widgetList, function(sub_id, i) {
        var sub = widgets_buffer[sub_id];
        if (typeof sub !== 'undefined') {
          widget.all_children[slot].push(sub);
          sub.parent = widget;
        } else {
          console.log('Invalid widget reference:' + sub_id);
        }
      });
    });
  }
}

functions.splitAndFill = function(state, values) {
  return cms.functions.fillValues(state, cms.functions.splitValues(values));
}

functions.splitValues = function(values) {
  var widgetValues = {};

  _.each(values, function(value, key) {
    var parts = key.split("-");
    if (parts.length == 2) {
      var widget_id = parts[0];
      var value_id = parts[1];

      if (!widgetValues[widget_id]) {
        widgetValues[widget_id] = {};
      }

      widgetValues[widget_id][value_id] = value;
    }
  });

  return widgetValues;
}

functions.fillValues = function(state, values) {
  _.each(state, function(w, id) {
    if (values[id]) {
      state[id] = _.extend(w, values[id]);
    }
  });

  return state;
}

functions.renderState = function(state, slotAssignments, callback, head_additional, deps) {
  cms.functions.renderStateParts(state, slotAssignments, function(html, deps, head, script) {
    var all_head = [];
    all_head = all_head.concat(head);
    all_head = all_head.concat(cms.functions.processDeps(deps));
    all_head.push('<script>$(function() {' + script + '});</script>');
    callback(html, all_head);
  });
}

functions.renderStateParts = function(state, slotAssignments, callback, values) {
  var head = [];
  var head_map = {};
  var script = '';

  var initial_values = values || {};

  cms.functions.organizeState(state, function(widgets_buffer) {
    loadAndPrepare(widgets_buffer);
  });

  function toHTML(widget, values) {
    if (widget.head) {
      _.each(widget.head(), function(head_element) {
        if (!(head_element in head_map)) {
          head_map[head_element] = true;
          head.push(head_element);
        }
      });
    }
    if (widget.script) {
      script += widget.script(widget.name);
    }
    if (widget.values) {
      _.extend(values, widget.values());
    }

    var zones = {};
    if (widget.zones) {
      _.each(widget.zones(), function(zone) {
        zones[zone] = '';
      });
    }

    _.each(widget.all_children, function(widgetList, zone) {
      var zone_html = '';

      _.each(widgetList, function(w, i) {
        zone_html += toHTML(w, values);
      });

      zones[zone] = zone_html;
    });

    var widget_html = '';
    if (widget.toHTML) {
      widget_html = widget.toHTML(zones, values[widget.id]);
    } else {
      _.each(zones, function(zone_html) {
        widget_html += zone_html;
      });
    }

    if (widget.isPage) {
      return widget_html;
    } else {
      return '<div class="widget-container widget-' + widget.name + '" id="' + widget.name + '">' + widget_html + '</div>';
    }
  }

  function loadAndPrepare(widgets_buffer) {
    var deps = {};

    async.each(Object.keys(widgets_buffer), function(id, callback) {
      var widget = widgets_buffer[id];
      if (widget.deps) {
        dextend(deps, widget.deps());
      }
      if (widget.load)
        widget.load(callback);
      else
        callback();
    }, function(err, results) {
      var html = '';
      _.each(slotAssignments['body'], function(id, index) {
        if (widgets_buffer[id]) {
          html += toHTML(widgets_buffer[id], initial_values);
        } else {
          console.log("Widget missing " + id);
        }
      });

      callback(html, deps, head, script);
    });
  }
}

widgets.state_editor = function (input, id) {
  var page = input.page || 'test';

  this.script = function() {
    return '$("input[type=\'submit\']").click(exportState);';
  }

  this.head = function() {
    return ['<script src="/modules/pages/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/pages/state-editor.css" />']
  }

  this.deps = function() {
    return {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};
  }

  this.toHTML = function(zones, value) {
    var v = JSON.stringify(value);
    return '<script type="text/javascript">var page = "'+ page + '"; var state = ' + v + ';</script>' +
    '<textarea style="display:none;" name="state">' + v + '</textarea>' +
    '<div ng-app><ul id="state-ctrl" ng-controller="stateController">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/pages/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/pages/widget.html\'"></li>' +
    '</div>';
  }
}var path = require('path'),
    _ = require('underscore'),
    fs = require('fs'),
    dive = require('dive'),
    mkdirp = require('mkdirp');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets; 
var functions = module.exports.functions;

functions.pageToStatic = function(fpath) {
  fs.readFile('pages/' + fpath + '.json', 'utf8', function(err, data) {
    if (err) {
      console.trace("Here I am!")
      return console.log(err);
    }
    console.log('static: ' + fpath);
    var jdata = JSON.parse(data);
    var state = jdata[0];
    var rules = jdata[1];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>'
      console.log('- ' + fpath);
      cms.functions.renderState(state, {}, function(html) {
        mkdirp(path.dirname('static/' + fpath), function(err) { 
          fs.writeFile('static/' + fpath  + '.html', html);
        });
      }, script, deps); //'<base href="http://localhost:3000/" target="_blank" >'
    });
  });
}

functions.allPagesToStatic = function() {
  dive('pages', {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative('pages',file).slice(0, -ext.length);
    if (ext == '.json') {
      cms.functions.pageToStatic(pa);
    }
  });
}

//http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
functions.copyFile = function(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

functions.staticThemeCopy = function() {
  var theme = 'themes/html5up-tessellate/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    mkdirp(path.dirname('static/' + pa), function(err) { 
      cms.functions.copyFile(file, 'static/' + pa, function() {

      });
    });
  });
}

functions.staticModulesCopy = function() {
  var theme = 'modules/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    if (ext == '.css' || ext == '.js' && pa.substr(pa.length - 4) != 'm.js') {
      mkdirp(path.dirname('static/' + pa), function(err) { 
        cms.functions.copyFile(file, 'static/' + pa, function() {

        });
      });
    }
  });
}var fs = require('fs'),
    _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets;

var copy = function (original) {
  return Object.keys(original).reduce(function (copy, key) {
      copy[key] = original[key];
      return copy;
  }, {});
}

widgets.json = function(input) {
  var file = input.file;
  var dir = input.dir || 'storage';
  var widget = input.widget || 'json'
  var values;

  this.deps = function() {
    return {'jquery' : []};
  }

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="file" value="' + file + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones['form'] + 
    '</form>';
  }

  this.load = function(callback) {
    fs.readFile(dir + '/' + file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      values = JSON.parse(data);
      callback();
    });
  }

  this.values = function() {
    return values;
  }

  this.save = function(values) {
    console.log(values);
    delete values['file'];
    fs.writeFile(dir + '/' + file + '.json', JSON.stringify(values, null, 4));
  }
}

widgets.ijson = function(input) {
  var dir = input.dir || 'storage/survey';
  var widget = input.widget || 'ijson'
  var values;

  this.deps = function() {
    return {'jquery' : []};
  }

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="id" value="' + input.id + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones['form'] + 
    '</form>';
  }

  this.load = function(callback) {
    if (typeof input.id !== 'undefined' && input.id != 'undefined') {
      fs.readFile(dir + '/' + (input.id) + '.json', 'utf8', function(err, data) {
        if (err) {
          console.trace("Here I am!")
          return console.log(err);
        }
        values = JSON.parse(data);
        console.log(values);
        callback();
      });
    } else {
      callback();
    }
    
  }

  this.values = function() {
    return values;
  }

  this.save = function(values) {
    console.log('-------');
    delete values['file'];
    delete values['dir'];
    var id = (typeof values.id !== 'undefined' && values.id != 'undefined') ? values.id : (widgets.ijson.counter++);
    delete values['id'];
    fs.writeFile(dir + '/' + id  + '.json', JSON.stringify(values, null, 4));
  }
}
widgets.ijson.init = function() {
  widgets.ijson.counter = 0;
  var files = fs.readdirSync('storage/survey');
  _.each(files, function(file) {
    var current = parseInt(file.split('.')[0]);
    if (current > widgets.ijson.counter) {
      widgets.ijson.counter = current + 1
    }
  });
}

widgets.pagejson = function(input) {
  input.widget = 'pagejson';
  var f = new widgets.json(input);

  f.save  = function(values) {
    var widgetValues = cms.m.pages.functions.splitValues(values);

    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        console.log(err);
      }
      var jdata = JSON.parse(data);
      jdata.widgets = cms.m.pages.functions.fillValues(jdata.widgets, widgetValues);
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata.widgets, null, 4));
    });
  }

  return f;
}

widgets.statejson = function(input) {
  input.widget = 'statejson';
  var f = new widgets.json(input);
  var current_state;

  f.load = function(callback) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      if (err) {
        console.log("JSON file doesn't exist");
        current_state = {};
        //console.log(err);
        callback();
        return;
      }
      var jdata = JSON.parse(data);
      current_state = jdata;
      callback();
    });
  }

  f.values = function() {
    return {'editor': current_state};
  }

  f.save  = function(values) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      var jdata;
      if (err) {
        console.log("JSON file doesn't exist")
        //console.log(err);
        jdata = {};
      } else {
        jdata = JSON.parse(data);
      }
      var newData = JSON.parse(values['state']);
      jdata.widgets = newData.widgets;
      jdata.slotAssignments = newData.slotAssignments;
      console.log(newData);
      console.log(JSON.stringify(jdata));
      console.log(input.dir + '/' + input.file + '.json');
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata, null, 4));
    });
  }

  return f;
}var fs = require('fs'),
    Handlebars = require("handlebars");

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.template = function(input) {
  var that = this;
  this.path = input.path;

  this.zones = function() {
    {name : 'body'};
  }

  this.isPage = function() {
    return true;
  }

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = Handlebars.compile(data);
      callback();
    });
  }

  this.toHTML = function(zones) {
    return this.template(zones);
  }
}

widgets.htmlfile = function(input) {
  var that = this;
  this.path = input.path;

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = data;
      callback();
    });
  }

  this.toHTML = function() {
    return this.template;
  }
}

widgets.centered = function() {
  this.zones = function() {
    return ['content'];
  }

  this.toHTML = function(zones) {
    var template = Handlebars.compile('<div style="margin-left: auto; width: 700px; margin-right: auto; border: 1px solid black; border-radius: 10px; padding: 15px; ">' + 
    ' {{{ content }}} </div>');
    return template(zones);
  }
}var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.login = function() {
  this.children = function(callback) {
    /*var state = {"start:htmlfile": {
        "path": "login.html"
    }};*/
    var state = {
        "start:form": {'widget': 'login','zones': {'form': ["username", "password", "save"]}},
        "username:field_text" : {"label": "Username"},
        "password:field_text" : {"label": "Password"},
        "save:submit" : {"label": "Login"},
    };
    callback({'body': state});
  }

  this.save = function(values) {
    console.log(values);
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

passport.use(new LocalStrategy(
  function(username, password, done) {
    /*User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });*/
    if (username == 'thomas')
      return done(null, user);
    else
      return done(null, false, { message: 'Incorrect username.' });
  }
));var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets,
    _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

widgets.two_col = function(input) {
  this.col1 = input.col1 || 6;
  this.col2 = input.col2 || 6;

  this.form = function() {
    return  {
      "col1" : {"type": "field_text", "label" : "Col 1 Width", "value" : this.col1},
      "col2" : {"type": "field_text", "label" : "Col 2 Width", "value" : this.col2}
    };
  }

  this.deps = function() {
    return {'jquery':[],'bootstrap': []};
  }

  this.toHTML = function(zones) {
    return '<div class="row"><div class="col-sm-' + this.col1 + '">' + zones['left'] + 
      '</div><div class="col-sm-' + this.col2 + '">' + zones['right'] + '</div></div>';
  }

  this.zones = function() {
    return ['left', 'right'];
  }
}

widgets.widget_selector = function (input, id) {
  var children = [];
  var html;

  this.deps = function() {
    return {'select2': []};
  }

  this.load = function(callback) {
    html = '<select class="widget-selector" style="display: none; width: 300px;">'
    html += '<option value="">- Select Widget -</option>'

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
      html += '<option value="' + w.name + '" data-form=\'' + (w.form ? true : false) + '\' data-zones=\''+ (w.zones ? JSON.stringify(w.zones()) : []) +'\'>' + w.name + '</option>'
    });

    html += '</select>';

    callback();
  }


  this.script = function() {
    return '$(".widget-selector").select2();';
  }

  this.toHTML = function(zones, value) {
    return html;
  }
}

widgets.widget_exporter = function(input) {
  var type = input.type || 'state_editor';
  var widget_input = {};
  var show_form = input.show_form || false;
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  if (input.input) {
    widget_input = JSON.parse(input.input);
  }
  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.isPage = function() {
    return true;
  }

  this.load = function(callback) {
    var viewReady = function(html, content_type, deps, head, javascript) {
      var all_head = [];
      all_head = all_head.concat(head);
      all_head = all_head.concat(cms.functions.processDeps(deps));
      _html = html;
      _head = all_head;
      _script = javascript;
      callback();
    }

    var state = false;

    if (show_form) {
      widget = new cms.widgets[type](values);
      if (widget.input) {
        state = widget.input();
      } else {
        error = 'Widget does not have a form';
      }
    } else {
      widget_input['type'] = type;
      state = {
        "start" : widget_input
      };
    }

    if (state) {
      cms.functions.renderStateParts(state, ['start'], viewReady);
    } else {
      callback();
    }
  }

  this.toHTML = function() {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    var out = {};
    var widget = cms.widgets[type];
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }
}

widgets.page_widget_form = function(input) {
  var widget_input = {};
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  if (input.input) {
    widget_input = JSON.parse(input.input);
  }
  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.isPage = function() {
    return true;
  }

  this.load = function(callback) {
    var viewReady = function(html, deps, head, javascript) {
      var all_head = [];
      console.log(html);
      all_head = all_head.concat(head);
      all_head = all_head.concat(cms.functions.processDeps(deps));
      _html = html;
      _head = all_head;
      _script = javascript;
      callback();
    }

    var state = false;

    fs.readFile('pages' + '/' + input.widget_page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace('JSON missing');
      }

      var jdata = JSON.parse(data);
      var widget_input = jdata.widgets[input.widget_id];

      widget = new cms.widgets[input.widget_type](widget_input);
      if (widget.form) {
        state = widget.form();
      } else {
        error = 'Widget does not have a form';
      }

      console.log(state);
      console.log(_.keys(state));

      if (state) {
        cms.functions.renderStateParts(state, {'body': _.keys(state) }, viewReady, widget_input);
      } else {
        callback();
      }
    });
  }

  this.toHTML = function(zones) {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    console.log('123');

    var out = {};
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }

  this.save = function(values) {
    fs.readFile('pages' + '/' + values.widget_page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("JSON file doesn't exist")
        console.log(err);
        return false
      }
      var jdata = JSON.parse(data);

      var page = values.widget_page;
      var id = values.widget_id;
      var type = values.widget_type;
      delete values['widget_page'];
      delete values['widget_id'];
      delete values['widget_type'];
        
      jdata.widgets[id] = values;
      jdata.widgets[id].type = type;
      fs.writeFile('pages' + '/' + page + '.json', JSON.stringify(jdata, null, 4));
      console.log('updated state of ' + page);
      console.log(values);
    });
  }
}