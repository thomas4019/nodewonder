var _ = require('underscore'),
		fs = require('fs'),
    async = require('async');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
  	cms = _cms;
  }
};
widgets = module.exports.widgets;

module.exports.functions.viewPage = function(path, vars, callback) {
  if (path == '/') {
    path = 'index'
  }
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      return console.log(err);
    }
    var jdata = JSON.parse(data);
    module.exports.functions.renderState(jdata, vars, callback);
  });
}

module.exports.functions.renderState = function(state, vars, callback) {
  var widgets_buffer = {};

  _.each(state, function(w, key) {
    var parts = key.split(":");
    var id = parts[0];
    var name = parts[1];
    if (cms.widgets[name]) {
      var widget = new cms.widgets[name](w, id);
      widget.id = id;
    } else {
      console.log('Missing widget:' + name);
    }
    widget.children = {};
    widgets_buffer[id] = widget;
  });

  console.log('loading widgets');
  _.each(state, function(w, key) {
    var parts = key.split(":");
    var id = parts[0];
    var name = parts[1];
    var widget = widgets_buffer[id];

    if (w.zones) {
      _.each(w.zones, function(widgetList, zone) {
        if (!widget.children[zone]) {
          widget.children[zone] = [];
        }
        _.each(widgetList, function(sub_id, i) {
          var sub = widgets_buffer[sub_id];
          if (typeof sub !== 'undefined') {
            widget.children[zone].push(sub);
            sub.parent = widget;
          } else {
            console.log('Invalid widget reference:' + sub_id);
          }
        });
      });
    }
  });

  var head = '';
  var onready = '';
  var values = {};

  var toHTML = function(widget) {
    var zones = {};

    if (widget.head) {
      head += widget.head();
    }
    if (widget.script) {
      onready += widget.script(widget.name);
    }
    if (widget.values) {
      _.extend(values, widget.values());
    }

    _.each(widget.children, function(widgetList, zone) {
      var zone_html = '';

      _.each(widgetList, function(w, i) {
        zone_html += toHTML(w);
      });

      zones[zone] = zone_html;
    });

    if (onready) {
    	head += '<script>$(function() {' + onready + '});</script>';
  	}

    var widget_html = '';

    if (widget.isPage) {
    	zones['head'] = head;
    }

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

  async.each(Object.keys(widgets_buffer), function(id, callback) {
    var widget = widgets_buffer[id];
    if (widget.load)
      widget.load(callback);
    else
      callback();
  }, function(err) {
  	console.log('rendering');
    var html = toHTML(widgets_buffer['start']);
    callback(html, head);
  });
}

widgets.echo = function(input) {
}

var set_type = function(state, id, type) {
  var target;

  _.each(state, function(w, key) {
    var parts = key.split(":");
    var _id = parts[0];
    var _type = parts[1];
    if (_id == id) {
    	target = key;
    }
  });

  state[id + ':' + type] = state[target];
  delete state[target];
}

widgets.page_editor = function(input) {
	var page = input.page;
	var html;
	var state;
	var head = '';

	this.load = function(callback) {
	  fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
	    if (err) {
	      return console.log(err);
	    }
	    state = JSON.parse(data);

	    var state2 = {};

		  _.each(state, function(w, key) {
		    var parts = key.split(":");
		    var _id = parts[0];
		    var _type = parts[1];
	    	w.widget = _type;
	    	state2[_id + ':' + 'widget_settings'] = w;
		  });

	    console.log(state2);

			module.exports.functions.renderState(state2, {}, function(_html, _head) {
				html = _html;
				head = _head
				callback();
			});
	  });
	}

	this.script = function() {
		return '/*$(".sortable").sortable();*/ $(".draggable").draggable( {connectToSortable: ".sortable", revert: "invalid"} );';
	}

	this.head = function() {
		return head + '<link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css">' +
  		'<script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>';
	}

	this.toHTML = function() {
		return html;
	}
}