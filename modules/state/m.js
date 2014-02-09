var _ = require('underscore'),
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
    return {'jquery': [], 'jquery-form': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};
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
}