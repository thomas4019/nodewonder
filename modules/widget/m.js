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
  return '<div class="field row ' + (error !== '' ? 'has-error' : '')  + '">' + label + widget + '</div>';
}

var widget_selector = function() {
	function toHTML() {

	}
}

widgets.two_col = function(col1, col2) {
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
}

widgets.widget_settings = function(input, id) {
	var widget = input.widget;
  var form_html;

	this.head = function() {
		return '<link href="/modules/widget/widget.css" rel="stylesheet">';
	}

  this.load = function(callback) {
    if (cms.widgets[widget]) {
      var w = new cms.widgets[widget](input, id);
    } else {
      console.log('Missing widget:' + widget);
    }
    
    var winput = null;
    if (w.input) {
     winput = w.input();
    }

    var winput2 = {};

    _.each(winput, function(w, key) {
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

    console.log(winput2);
    if (winput) {
      cms.m.pages.functions.renderState(winput2, {}, function(_html, head) {
        form_html = _html;
        callback();
      });
    } else {
      form_html = '';
      callback();
    }
  }

  this.toHTML = function(zones) {
    var form = {};

    /*form['text'] = fields.string(_.extend(bootstrap_settings,{value : '', label : ''}));
    form['quantity'] = fields.string(_.extend(bootstrap_settings,{value : '', label : ''}));
    form['hierarchy'] = fields.boolean(_.extend(bootstrap_settings,{value : '', label : ''}));

    var form_html = forms.create(form).toHTML(bootstrap_f);*/

    var configure_gear = '<div class="configure"><span class="glyphicon glyphicon-cog"></span></div>';
    
    var zones_html = '';

    _.each(zones, function(zone_html, zone_name) {
      zones_html += '<div class="sortable">' + zone_html + '</div>';
    });

    return '<div class="well draggable">' +
    '<h4>' + widget + '</h4>'
     + configure_gear + form_html + zones_html + 
     '</div>';
  }
}