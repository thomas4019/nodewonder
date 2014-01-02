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
functions = module.exports.functions;

functions.organizeState = function(state, callback) {
  var widgets_buffer = {};
  var count = 1;

  var initializeWidget = function(w, key) {
    var parts = key.split(":");
    var id = parts[0];
    var name = parts[1];
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
          _.each(widgetStateList, function(widgetInput, key) {
            var partsC = key.split(":");
            var idC = partsC[0];
            var nameC = partsC[1];
            if (idC == 'start') {
              idC = id + 'inner-' + idC;
              key = idC + ':' + nameC;
            }
            if (!heirarchical) {
              w.zones = w.zones || {};
              w.zones[zone] = w.zones[zone] || [];
              w.zones[zone].push(idC);
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
    _.each(state, function(w, key) {
      var parts = key.split(":");
      var id = parts[0];
      var name = parts[1];
      var widget = widgets_buffer[id];

      if (w.zones) {
        addChildrenToWidget(w.zones, widget);
      }
    });

    callback(widgets_buffer);
  }

  function addChildrenToWidget(zones, widget) {
    _.each(zones, function(widgetList, zone) {
      if (!widget.all_children[zone]) {
        widget.all_children[zone] = [];
      }
      _.each(widgetList, function(sub_id, i) {
        var sub = widgets_buffer[sub_id];
        if (typeof sub !== 'undefined') {
          widget.all_children[zone].push(sub);
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

      if (!widgetValues['widget_id']) {
        widgetValues[widget_id] = {};
      }

      widgetValues[widget_id][value_id] = value;
    }
  });

  return widgetValues;
}

functions.fillValues = function(state, values) {
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

functions.viewPage = function(path, vars, callback) {
  if (path == '/') {
    path = 'index'
  }
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      console.trace("Here I am!")
      return console.log(err);
    }
    var jdata = JSON.parse(data);
    var state = jdata[0];
    var rules = jdata[1];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>'
      cms.functions.renderState(state, vars, callback, script, deps);
    });
  });
}

functions.renderState = function(state, vars, callback, head_additional, deps) {
  state = cms.functions.splitAndFill(state, vars);

  var head = '';
  var onready = '';
  var values = {};

  cms.functions.organizeState(state, function(widgets_buffer) {
    loadAndPrepare(widgets_buffer);
  });

  function toHTML(widget) {
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

    if (widget.zones) {
      _.each(widget.zones(), function(zone) {
        zones[zone] = '';
      });
    }

    _.each(widget.all_children, function(widgetList, zone) {
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

  function loadAndPrepare(widgets_buffer) {
    async.series([
        function(callback1){
          async.each(Object.keys(widgets_buffer), function(id, callback) {
            var widget = widgets_buffer[id];
            if (widget.load)
              widget.load(callback);
            else
              callback();
          }, callback1);
        },
        function(callback1){
          cms.functions.processDeps(deps, function(html) {
            head_additional += html
            callback1();
          });
        }
    ],
    function(err, results){
      var html = toHTML(widgets_buffer['start']);

      //We send back the head as well in case this rendering is internal and needs to know the code to add to the head as well.
      //Todo - probably better to pass back dependencies instead?
      callback(html, head);
    });
  }
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
  var state2 = {};

  this.children = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      var jdata = JSON.parse(data);
      var state = jdata[0];
      var rules = jdata[1];

      _.each(state, function(w, key) {
        var parts = key.split(":");
        var _id = parts[0];
        var _type = parts[1];
        w.widget = _type;
        state2[_id + ':' + 'widget_settings'] = w;
      });

      callback({'body' : state2});
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

  this.deps = function() {
    return {'jquery-ui': {}};
  }

  this.toHTML = function(zones) {
    return (zones['body'] || '');
  }
}

widgets.page_heirarchy = function (input, id) {
  var children = [];

  page = input.page || 'test2';

  this.head = function() {
    return '<script src="/modules/forms/data.js" type="text/javascript"></script>';
  }

  this.deps = function() {
    return {'dynatree' : [], 'jquery-ui' : []};
  }

  this.load = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      state = JSON.parse(data);

      cms.functions.organizeState(state, function(widgets_buffer) {
        children.push(toTreeArray(widgets_buffer['start']));
        callback();
      });

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
    return '<script src="/modules/forms/data.js" type="text/javascript"></script>';
  }

  this.deps = function() {
    return {'dynatree' : [], 'jquery-ui' : []};
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