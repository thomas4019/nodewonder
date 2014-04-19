var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    path = require('path'),
    dextend = require('dextend'),
    deep = require('deep');

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

function retreive(val) {
  return (typeof val === 'function') ? val() : val;
}

functions.initializeState = function(state, scope, callback) {
  var widgets_buffer = {};
  var count = 1;
  var results = {deps: {}};

  var initializeWidget = function(w, id) {
    var name = w.type;
    if (cms.widgets[name]) {
      var widget = new cms.widgets[name](w.settings || {}, id, scope);
      widget.id = id;
    } else {
      console.error('Missing widget:' + name);
    }
    widget.all_children = {};

    if (widget.children) {
      count++;
      widget.children(function(children, slotAssignments) {
        if (slotAssignments) {
          w.slots = {};
          _.each(slotAssignments, function(ids, slot) {
            w.slots[slot] = _.map(ids, function(_id) {
              return id+'-'+_id;
            });
          })
        }
        _.each(children, function(widgetStateList, zone) {
          var heirarchical = false;
          _.each(widgetStateList, function(widgetInput, idC) {
            var nameC = widgetInput.type;
            idC = id + '-' + idC;

            if (!slotAssignments) {
              w.slots = w.slots || {};
              w.slots[zone] = w.slots[zone] || [];
              w.slots[zone].push(idC);
            }

            state[idC] = widgetInput;

            _.each(widgetInput.slots, function(ids, slot) {
              widgetInput.slots[slot] = _.map(ids, function(_id) {
                return id+'-'+_id;
              });
            })

            initializeWidget(widgetInput, idC);
          });
        });
        count--;
        part2();
      });
    }
    if (widget.deps) {
      dextend(results.deps, retreive(widget.deps));
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

    callback(widgets_buffer, results, state);
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
          console.error('Invalid widget reference:' + sub_id);
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
      state[id]['settings'] = _.extend(w, values[id]);
    }
  });

  return state;
}

functions.renderState = function(state, slotAssignments, callback, values) {
  cms.functions.renderStateParts(state, slotAssignments, function(html, results) {
    var all_head = [];
    all_head = all_head.concat(results.head);
    all_head = all_head.concat(cms.functions.processDeps(results.deps));
    all_head.push('<script>$(function() {' + results.script + '});</script>');
    callback(html, all_head);
  }, values);
}

functions.renderStateParts = function(state, slotAssignments, callback, values) {

  cms.functions.initializeState(state, values, function(widgets_buffer, results, state) {
    var render_results = {
      'head': [],
      'head_map': {},
      'script': '',
      'values': (values || {}),
      'deps': results.deps
    };

    async.each(Object.keys(widgets_buffer), function(id, callback) {
      var widget = widgets_buffer[id];
      widget.results = render_results;

      if (widget.load)
        widget.load(callback);
      else
        callback();
    }, function(err, results) {
      var html = '';
      _.each(slotAssignments['body'], function(id, index) {
        if (widgets_buffer[id]) {
          html += widgets_buffer[id].html();
        } else {
          console.error("Widget missing " + id);
        }
      });

      callback(html, render_results);
    });

  });
}