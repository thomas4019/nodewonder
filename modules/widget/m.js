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
  return '<div class="field ' + (error !== '' ? 'has-error' : '')  + '">' + label + widget + '</div>';
}

var widget_selector = function() {
	function toHTML() {

	}
}

widgets.two_col = function(input) {
	this.col1 = input.col1 || 6;
	this.col2 = input.col2 || 6;

	this.input = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["col1", "col2"] }},
      "col1:field_text" : {"label" : "Col 1 Width", "value" : this.col1},
      "col2:field_text" : {"label" : "Col 2 Width", "value" : this.col2}
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

widgets.widget_settings = function(input, id) {
	var widget = input.widget;
  var form_html;
  var winput2 = {};

	this.head = function() {
		return ['<link href="/modules/widget/widget.css" rel="stylesheet" />'];
	}

  this.children = function(callback) {
    if (cms.widgets[widget]) {
      var w = new cms.widgets[widget](input, id);
    } else {
      console.log('Missing widget:' + widget);
    }
    
    if (w.input) {
      _.each(w.input(), function(w, key) {
        var parts = key.split(":");
        var _id = parts[0];
        var _type = parts[1];

        //prepend parent's id plus dash to ids
        if (_id != 'start') {
          winput2[id + '-' + _id + ':' + _type] = w;
        } else {
          winput2[key] = w;
        }

        if (w.zones) {
          _.each(w.zones, function(widgetList, zone) {
            w.zones[zone] = _.map(widgetList, function(sub_id, i) {
              return id + '-' + sub_id;
            });
          });
        }
      });
    }

    callback( {'self_form' : winput2} );
  }

  this.toHTML = function(zones) {
    var configure_gear = '<div class="configure"><span class="glyphicon glyphicon-cog"></span></div>';
    
    var zones_html = '<div class="zones">';
    _.each(zones, function(zone_html, zone_name) {
      if (zone_name != 'self_form') {
        zones_html += '<div class="sortable zone"><h3 class="droppable zone-drop">' + zone_name + '</h3>' + zone_html + '</div>';
      }
    });
    zones_html += '</div>';

    return '<div class="well draggable">' +
    '<h4>' + widget + '</h4>'
     + configure_gear
     + (zones['self_form'] || '')
     + zones_html + 
     '</div>';
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
      html += '<option value="' + w.name + '" data-zones=\''+ (w.zones ? JSON.stringify(w.zones()) : []) +'\'>' + w.name + '</option>'
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

  this.contentType = function() {
    return 'text/javascript';
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
      var key = "start:"+type;
      state = {};
      state[key] = widget_input;
    }

    if (state) {
      cms.functions.renderStateParts(state, viewReady);
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