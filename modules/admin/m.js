  var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    Handlebars = require("handlebars"),
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

function retrieve(val, otherwise) {
  if (typeof val === 'undefined')
    return otherwise;
  return (typeof val == 'function') ? val() : val;
}

widgets.middleware_listing = {
  deps: {jquery: [],bootstrap: [], 'jquery.tablesorter': ['css/theme.blue.css','css/theme.bootstrap.css', 'js/jquery.tablesorter.widgets.js']},
  script: function () {
    return '$("#'+this.id+' table").tablesorter({widgets:["zebra", "stickyHeaders"]});';
  },
  toHTML: function() {
    var html = '<table class="tablesorter-blue">';
    html += '<thead> <tr> <th>Module</th> <th>Name</th> <th>Priority</th> </tr> </thead>'

    html += '<tbody>';
    _.each(cms.middleware, function(w) {
      html += '<tr> <td>' + w.module + '</td> <td>' + w.name + '</td> <td>' + w.priority + '</td> ';
      html += '</tr>';
    });
    html += '</tbody>';

    html += '</table>';

    return html;
  }
}

widgets.widget_code_editor = {
  head: ['/modules/admin/widget_code_editor.js', '/modules/admin/widget_code_editor.css'],
  tags: ['field_edit'],
  settingsModel: [{'name': 'label', 'type': 'Text'},
    {"name": "data", "type": "Widgets"}],
  deps: {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']},
  children: function(callback) {
    var body = {};
    body['sel'] = {'type': 'widget_selector'}
    callback({'body': body});
  },
  script: function() {
    return 'angular.bootstrap("#' + this.id + '");';
  },
  processData: function(data) {
    console.log(data);
    return data ? JSON.parse(data) : undefined;
  },
  toHTML: function(label) {
    var v = JSON.stringify(this.settings.data || {});
    v = v.replace(/'/g, "&#39;");
    return this.renderSlot('body') +
    '<textarea style="display: none;" class="widget-code-editor" name="'+this.id+'"></textarea>' +
    label +
    '<div class="ng" ng-init=\'edit_widgets = '+JSON.stringify(cms.edit_widgets)+';view_widgets = '+JSON.stringify(cms.view_widgets)+';view_widgets = '+JSON.stringify(cms.view_widgets)+';state = ' + v + ';field_id="'+this.id+'";\' >' +
    '<div ng-controller="stateController">' +
    '<div class="widget-menu" ng-if="menu || cut" ng-include="\'/modules/admin/widget-menu.html\'"></div>' +
    '<ul id="state-ctrl">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/admin/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/admin/widget.html\'"></li>' +
    '</div>' +
    '</div>' + '<input type="hidden" class="slot-selector">';
  }
}

widgets.widget_selector = {
  deps: {'select2': []},
  head: function() {
  	var widgets = {};
  	_.each(cms.widgets, function(w, name) {
  		widgets[w.name] = {
  			id: w.name,
  			text: w.name,
  			name: w.name,
        widget: w.name,
  			tags: w.tags,
  			settings: retrieve(w.settingsModel, false),
  			slots: retrieve(w.slots, []),
        slot_tags: retrieve(w.slot_tags, {})
  		};
      /*if (_.contains(w.tags,'view')) {
        widgets[w.name].slots.push('events');
        widgets[w.name].slot_tags['events'] = ['event'];
      }*/
      if (_.contains(w.tags,'event')) {
        widgets[w.name].slots.push('actions');
        widgets[w.name].slot_tags['actions'] = ['action'];
      }
      if (w.pseudo_names) {
        var widget = widgets[w.name];
        _.each(retrieve(w.pseudo_names, []), function(pseudo_name) {
          widgets[pseudo_name] = deep.clone(widget);
          widgets[pseudo_name].text = pseudo_name;
          widgets[pseudo_name].name = name;
          widgets[pseudo_name].widget = name;
          widgets[pseudo_name].id = pseudo_name;
          widgets[pseudo_name].settings = w.settingsModel(pseudo_name);
        });
      }
    });
  
  	return ['<script type="text/javascript">nw.widgets=' + JSON.stringify(widgets) + ';</script>'];
  },
  script: function() {
    return 'setupWidgetSelector("#' + this.id + ' .widget-selector");';
  },
  toHTML: function(value) {
    return '<input type="hidden" class="widget-selector">';
  }
}

functions.getWidgetUsage = function() {
  var usage = {};
  _.each(cms.model_data['model'], function(model, model_name) {
    _.each(model.fields, function(field) {
      if (field.type == 'Widgets') {
        _.each(cms.model_data[model_name], function(data, record) {
          if (data[field.name]) {
            _.each(data[field.name].widgets, function(widget, id) {
              usage[widget.type] = usage[widget.type] || 0;
              usage[widget.type]++;
            });
          }
        });
      }
    });
  });
  return usage;
}

widgets.widget_listing = {
  deps: {jquery: [],bootstrap: [], 'jquery.tablesorter': ['css/theme.blue.css','css/theme.bootstrap.css', 'js/jquery.tablesorter.widgets.js']},
  script: function () {
    return '$("#'+this.id+' table").tablesorter({widgets:["zebra", "stickyHeaders"]});';
  },
  toHTML: function() {
    var usage = cms.functions.getWidgetUsage();

    var html = '<table class="tablesorter-blue">';
    html += '<thead> <tr><th>Module</th> <th>Widget Name</th> <th>Usage</th> <th>Settings</th> <th>Deps</th> <th>Tags</th> <th>Data</th> <th>Slots</th> <th>Slot Tags</th></tr> </thead>'

    html += '<tbody>';
    _.each(cms.widgets, function(w) {
      var settings = retrieve(w.settingsModel);
      var data;
      _.each(settings, function(field) {
        if (field.name == 'data') {
          data = field;
        }
      });
      html += '<tr> <td>' + w.module + '</td> <td>' + w.name + '</td> <td>' + usage[w.name] + '</td> ' +
      '<td>' + (w.settings ? JSON.stringify(w.settings) : '') + '</td> <td>' + (w.deps ? JSON.stringify(w.deps) : '') + '</td> ' +
      '<td>' + (w.tags ? JSON.stringify(w.tags) : '') + '</td>  <td>' + (data ? data.type : '') + '</td> ' +
      '<td>' + (w.slots ? JSON.stringify(retrieve(w.slots)) : '') + '</td> <td>' + (w.slot_tags ? JSON.stringify(w.slot_tags) : '') + '</td>  </tr>';
    });
    html += '</tbody>';

    html += '</table>';

    return html;
  }
}

widgets.echo = {}

widgets.hello_world =  {
  toHTML: function() {
    return 'Hello World';
  }
}