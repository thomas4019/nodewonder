var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    Handlebars = require("handlebars");

var cms;
module.exports = {
  widgets : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;

function retreive(val) {
  return (typeof val == 'function') ? val() : val;
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
}

widgets.state_editor = function (input, id) {
  var page = input.page || 'test';

  this.script = '$("input[type=\'submit\']").click(exportState);';

  this.head = ['<script src="/modules/admin/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/admin/state-editor.css" />'];

  this.deps = {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};

  this.toHTML = function(zones, value) {
    var v = JSON.stringify(value);
    return '<script type="text/javascript">var page = "'+ page + '"; var state = ' + v + ';</script>' +
    '<textarea style="display:none;" name="state">' + v + '</textarea>' +
    '<div ng-app><ul id="state-ctrl" ng-controller="stateController">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/admin/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/admin/widget.html\'"></li>' +
    '</div>';
  }
}

widgets.widget_code_editor = function (input, id) {
  var page = input.page || 'admin/pages';

  this.head = ['<script src="/modules/admin/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/admin/state-editor.css" />'];

  this.deps = {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};

  this.children = function(callback) {
    var body = {};
    body['sel'] = {'type': 'widget_selector'}
    callback({'body': body});
  }

  this.processData = function(data) {
    return JSON.parse(data);
  }

  this.toHTML = function(slots, value) {
    var v = JSON.stringify(input.data || value || {});
    return slots['body'].html() + '<script type="text/javascript">var page = "'+ page + '"; var state = ' + v + ';</script>' +
    '<textarea style="display: none;" class="widget-code-editor" name="'+id+'">'+v+'</textarea>' +
    '<label>Widget Code:</label><div ng-app><ul id="state-ctrl" ng-controller="stateController">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/admin/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/admin/widget.html\'"></li>' +
    '</div>';
  }
}

widgets.widget_selector = function (input, id) {
  var children = [];
  var html;

  this.deps = {'select2': []};

  this.load = function(callback) {
    html = '<select class="widget-selector" style="display: none; width: 300px;">'
    html += '<option value="">- Select Widget -</option>'

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
      html += '<option value="' + w.name + '" data-settings=\'' + (w.settings ? JSON.stringify(w.settings()) : false) + '\' data-zones=\''+ (w.zones ? JSON.stringify(retreive(w.zones)) : []) +'\'>' + w.name + '</option>'
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

widgets.widget_listing = function (input, id) {
  var children = [];
  var html;

  this.deps = {bootstrap: []};

  this.load = function(callback) {
    html = '<table class="table">';
    html += '<tr><th>Widget Name</th> <th>Deps</th> <th>Tags</th></tr>'
    //html += '<option value="">- Select Widget -</option>';

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
      html += '<tr><td>' + w.name + '</td> <td>' + (w.deps ? JSON.stringify(w.deps) : '') + '</td> <td>' + (w.tags ? JSON.stringify(w.tags) : '') + '</td> </tr>';
    });

    html += '</table>';

    callback();
  }

  this.toHTML = function(zones, value) {
    return html;
  }
}

widgets.echo = function(input) {
}

widgets.hello_world = function() {
  this.toHTML = function() {
    return 'Hello World';
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

  this.wrapper = 'none';

  this.load = function(callback) {
    var viewReady = function(html, results) {
      var all_head = [];
      all_head = all_head.concat(results.head);
      all_head = all_head.concat(cms.functions.processDeps(results.deps));
      _html = html;
      _head = all_head;
      _script = results.script;
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

  this.wrapper = 'none';

  this.load = function(callback) {
    var viewReady = function(html, results) {
      var all_head = [];
      all_head = all_head.concat(results.head);
      all_head = all_head.concat(cms.functions.processDeps(results.deps));
      _html = html;
      _head = all_head;
      _script = results.script;
      callback();
    }

    var render = function(widget_input) {
      widget = new cms.widgets[widget_input.type](widget_input);
      if (widget.form) {
        state = widget.form();
      } else {
        error = 'Widget does not have a form';
      }

      if (state) {
        cms.functions.renderStateParts(state, {'body': _.keys(state) }, viewReady, widget_input);
      } else {
        callback();
      }

    }

    var state = false;

    if (input.widget_page) {
      fs.readFile('pages' + '/' + input.widget_page + '.json', 'utf8', function(err, data) {
        if (err) {
          console.trace('JSON missing');
        }

        var jdata = JSON.parse(data);
        var widget_input = jdata.widgets[input.widget_id];
        render(widget_id);
      });
    } else if (input.widget_input) {
      var widget_input = JSON.parse(input.widget_input);
      widget_input['type'] = input.widget_type;
      render(widget_input);
    } else {
      render({type: 'echo'});
    }
  }

  this.toHTML = function(zones) {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

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
      delete values['widget_page'];
      delete values['widget_id'];

      var slots = jdata.widgets[id].slots;
      var type = jdata.widgets[id].type;
        
      jdata.widgets[id] = values;
      jdata.widgets[id].type = type;
      jdata.widgets[id].slots = slots;
      fs.writeFile('pages' + '/' + page, JSON.stringify(jdata, null, 4));
      //console.log('updated state of ' + page + '.json id:' + id + ' type: ' + type);
      //console.log(values);
    });
  }
}

widgets.render_widget = function(input) {
  var values = {};
  var _html;
  var _head;
  var _script;

  var error;

  widget_input = (input.input) ? JSON.parse(input.input) : {};

  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.wrapper = 'none';

  this.load = function(callback) {
    var viewReady = function(html, results) {
      var all_head = [];
      all_head = all_head.concat(results.head);
      all_head = all_head.concat(cms.functions.processDeps(results.deps));
      _html = html;
      _head = all_head;
      _script = results.script;
      callback();
    }

    widget_input['type'] = input.widget_type;
    var state = {};
    state[input.widget_id] = widget_input;

    if (state) {
      cms.functions.renderStateParts(state, {'body': _.keys(state) }, viewReady);
    } else {
      callback();
    }
  }

  this.toHTML = function(zones) {
    if (error) {
      var out = {error: error};
      return JSON.stringify(out);
    }

    var out = {};
    out['html'] = _html;
    out['head'] = _head;
    out['javascript'] = _script;
    var json_out = JSON.stringify(out);
    return json_out;
  }
}