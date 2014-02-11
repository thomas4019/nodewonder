var forms = require('forms'),
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