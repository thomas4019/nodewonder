var _ = require('underscore'),
		fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    path = require('path');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
  	cms = _cms;
  }
};
widgets = module.exports.widgets;

module.exports.functions.organizeState = function(state) {
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

  return widgets_buffer;
}

module.exports.functions.splitAndFill = function(state, values) {
  return module.exports.functions.fillValues(state, module.exports.functions.splitValues(values));
}

module.exports.functions.splitValues = function(values) {
  var widgetValues = {};

  _.each(values, function(value, key) {
    var parts = key.split("-");
    if (parts.length == 2) {
      var widget_id = parts[0];
      var value_id = parts[1];

      if (!widgetValues['widget_id']) {
        widgetValues[widget_id] = {};
      }

      widgetValues[widget_id][value_id] = value;
    }
  });

  return widgetValues;
}

module.exports.functions.fillValues = function(state, values) {
  _.each(state, function(w, key) {
    var parts = key.split(":");
    var _id = parts[0];
    var _type = parts[1];
    if (values[_id]) {
      state[key] = _.extend(w, values[_id]);
    }
  });

  return state;
}

module.exports.functions.viewPage = function(path, vars, callback) {
  if (path == '/') {
    path = 'index'
  }
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      return console.log(err);
    }
    var jdata = JSON.parse(data);
    var state = jdata[0];
    var rules = jdata[1];
    cms.functions.processRules(rules, function(script, reqs) {
      script = '<script>$(function() {' + script + '});</script>'
      console.log(reqs);
      module.exports.functions.renderState(state, vars, callback, script + reqs);
    });
  });
}

module.exports.functions.renderState = function(state, vars, callback, head_additional) {
  state = module.exports.functions.splitAndFill(state, vars);

  var widgets_buffer = module.exports.functions.organizeState(state);

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
      if (head_additional) {
        head += head_additional;
      }
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
	    var jdata = JSON.parse(data);
      var state = jdata[0];
      var rules = jdata[1];

	    var state2 = {};

		  _.each(state, function(w, key) {
		    var parts = key.split(":");
		    var _id = parts[0];
		    var _type = parts[1];
	    	w.widget = _type;
	    	state2[_id + ':' + 'widget_settings'] = w;
		  });

			module.exports.functions.renderState(state2, {}, function(_html, _head) {
				html = _html;
				head = _head
				callback();
			});
	  });
	}

	this.script = function() {
		return '$(".zone-drop").sortable({connectWith: ".zone-drop"}); $(".draggable").draggable({connectToSortable: ".zone-drop"});  $( ".droppable" ).droppable({' + 
      'greed: true,' +
      'activeClass: "zone-drop-hover",' +
      'hoverClass: "zone-drop-active",' +
      'tolerance: "pointer",' + 
      'drop: function( event, ui ) { $( this ).addClass("zone-dropped"); }' +
      '}); ';
	}

	this.head = function() {
		return head + '<link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css">' +
  		'<script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>';
	}

	this.toHTML = function() {
		return html;
	}
}

widgets.page_heirarchy = function (input, id) {
  var children = [];

  page = input.page || 'test2';

  this.head = function() {
    return '<link href="/modules/forms/dynatree/skin-vista/ui.dynatree.css" rel="stylesheet" type="text/css">' + 
    '<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>' +
    '<script src="/modules/forms/dynatree/jquery.dynatree.js" type="text/javascript"></script>' +
    '<script src="/modules/forms/data.js" type="text/javascript"></script>';
  }

  this.load = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      state = JSON.parse(data);

      var widgets_buffer = module.exports.functions.organizeState(state);

      var toTreeArray = function(w) {
        var element = {title: w.id + ':' + w.name, children : [], expand: true};
        _.each(w.children, function(zone_children, zone) {
          var zone_element = {title: zone, isFolder: true, children : [], expand: true};
          _.each(zone_children, function(child) {
            zone_element.children.push(toTreeArray(child));
          });
          element.children.push(zone_element);
        });

        return element;
      }

      children.push(toTreeArray(widgets_buffer['start']));

      callback();
    });
  }


  this.script = function() {
    return 'console.log(data); $("#tree").dynatree({children : ' + JSON.stringify(children) + ', dnd : dnd2});';
  }

  this.toHTML = function(zones, value) {
    return '<div id="tree">123</div>';
  }
}

widgets.widget_listing = function (input, id) {
  var children = [];

  this.head = function() {
    return '<link href="/modules/forms/dynatree/skin-vista/ui.dynatree.css" rel="stylesheet" type="text/css">' + 
    '<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>' +
    '<script src="/modules/forms/dynatree/jquery.dynatree.js" type="text/javascript"></script>' +
    '<script src="/modules/forms/data.js" type="text/javascript"></script>';
  }

  this.load = function(callback) {

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      children.push({title : w.name, copy: 'listing'});
    });

    callback();
  }


  this.script = function() {
    return 'console.log(data); $("#tree2  ").dynatree({children : ' + JSON.stringify(children) + ', dnd : dnd2});';
  }

  this.toHTML = function(zones, value) {
    return '<div id="tree2">123</div>';
  }
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

  this.script = function() {
    return '';
  }

  this.toHTML = function() {
    var html = '<h1>Pages</h1><ul class="list-group">';
    _.each(paths, function(path, index) {
      var edit_path = 'admin/pages/edit?storage-file=' + path + '&editor-page=' + path;
      html += '<li class="list-group-item" >' +
      '<a href="/' + edit_path + '"><span class="glyphicon glyphicon-edit"></span></a> ' +
      '<a href="/' + path + '">' + path + '</a></li>';
    });
    html += '</ul>';
    return html;
  }
}