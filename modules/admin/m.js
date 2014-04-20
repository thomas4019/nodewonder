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

widgets.widget_code_editor = function (input, id) {

  this.model = ['Widgets']

  this.head = ['<script src="/modules/admin/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/admin/state-editor.css" />'];

  this.settings = [{'name': 'label', 'type': 'Text'}];

  this.deps = {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};

  this.children = function(callback) {
    var body = {};
    body['sel'] = {'type': 'widget_selector'}
    callback({'body': body});
  }

  this.script = function() {
    return 'angular.bootstrap("#' + id + '");';
  }

  this.processData = function(data) {
    return JSON.parse(data);
  }

  this.toHTML = function(slots, value) {
    var v = JSON.stringify(input.data || value || {});
    return slots['body'].html() +
    '<textarea style="display: none;" class="widget-code-editor" name="'+id+'">'+v+'</textarea>' +
    (input.label ? '<label>'+input.label+':</label>' : '') +
    '<div class="ng" ng-init=\'field_widgets = '+JSON.stringify(cms.view_widgets)+';state = ' + v + ';field_id="'+id+'";\' >' +
    '<div ng-controller="stateController">' +
    '<div class="widget-menu" ng-if="menu || cut" ng-include="\'/modules/admin/widget-menu.html\'"></div>' +
    '<ul id="state-ctrl">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/admin/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/admin/widget.html\'"></li>' +
    '</div>' +
    '</div>' + '<input type="hidden" class="slot-selector">';
  }
}

widgets.widget_selector = function (input, id) {
  var children = [];

  this.deps = {'select2': []};

  this.head = function() {
  	var widgets = {};
  	_.each(cms.widgets, function(widget, name) {
  		w = new widget({});
  		widgets[w.name] = {
  			id: w.name,
  			text: w.name,
  			name: w.name,
        widget: w.name,
  			tags: w.tags,
  			settings: (w.settings ? retreive(w.settings) : false),
  			zones: (w.zones ? retreive(w.zones).concat(['actions']) : []),
        zone_tags: (w.zone_tags ? retreive(w.zone_tags) : []),
  		};
    });
  
  	return ['<script type="text/javascript">var widgets=' + JSON.stringify(widgets) + ';</script>'];
  }

  this.script = function() {
    return 'setupWidgetSelector("#' + id + ' .widget-selector");';
  }

  this.toHTML = function(zones, value) {
    return '<input type="hidden" class="widget-selector">';
  }
}

widgets.widget_listing = function (input, id) {
  var children = [];
  var html;

  this.deps = {bootstrap: []};

  this.load = function(callback) {
    html = '<table class="table">';
    html += '<tr><th>Widget Name</th> <th>Deps</th> <th>Tags</th></tr>'

    _.each(cms.widgets, function(widget) {
      w = new widget({});
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