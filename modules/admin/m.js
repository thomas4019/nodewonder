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

  this.head = ['<script src="/modules/admin/state-utils.js" type="text/javascript"></script>',
    '<link rel="stylesheet" href="/modules/admin/state-editor.css" />'];

  this.deps = {'jquery': [], 'bootstrap': [], 'angular': [], 'underscore': ['underscore.js'], 'font-awesome': ['css/font-awesome.css']};

  this.children = function(callback) {
    var body = {};
    body['sel'] = {'type': 'widget_selector'}
    callback({'body': body});
  }

  this.processData = function(data) {
    return JSON.parse(data);
  }

  this.toHTML = function(slots, value) {
    var v = JSON.stringify(input.data || value || {});
    return slots['body'].html() + '<script type="text/javascript">var state = ' + v + ';</script>' +
    '<textarea style="display: none;" class="widget-code-editor" name="'+id+'">'+v+'</textarea>' +
    '<label>Widget Code:</label><div ng-app ng-init=\'field_widgets = '+JSON.stringify(cms.view_widgets)+'\' >' +
    '<ul id="state-ctrl" ng-controller="stateController">' +
    '<li ng-init="id = \'body\'; slot_name = \'body\';" id="{{ id }}-{{ slot_name }}" ng-include="\'/modules/admin/slot.html\'"></li>' +
    '<li ng-repeat="id in slotAssignments[\'body\']" id="{{ id }}" ng-include="\'/modules/admin/widget.html\'"></li>' +
    '</div>';
  }
}

widgets.widget_selector = function (input, id) {
  var children = [];
  var html;

  this.deps = {'select2': []};

  this.load = function(callback) {
    html = '<select class="widget-selector" style="display: none; width: 300px;">'
    html += '<option value="">- Select Widget -</option>'

    var model = cms.model_data['model']['custom_page'];
    var groups = {};

    html += '<optgroup label="'+'model record'+'">';
    _.each(model.fields, function(field) {
      var w = field.widget ? new cms.widgets[field.widget]({}) : {};
      html += '<option value="'+field.widget+'" data-field="'+field.name+ '" data-type="'+field.type+'" data-model="' +'custom_page' + '" ' +
      'data-settings=\'' + (w.settings ? JSON.stringify(retreive(w.settings)) : false) + '\' data-zones=\''+ (w.zones ? JSON.stringify(retreive(w.zones)) : []) + '\'>' +
      field.name+'</option>';
    });
    html += '</optgroup>';

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      _.each(w.tags, function(tag) {
        groups[tag] = groups[tag] || [];
        groups[tag].push(w);
      });
    });

    _.each(groups, function(widgets, name) {
      html += '<optgroup label="'+name+'">';
      _.each(widgets, function(w) {
        html += '<option value="' + w.name + '" data-settings=\'' + (w.settings ? JSON.stringify(retreive(w.settings)) : false) + '\' data-zones=\''+ (w.zones ? JSON.stringify(retreive(w.zones)) : []) +'\'>' + w.name + '</option>'
      });
      html += '</optgroup>';
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

widgets.widget_listing = function (input, id) {
  var children = [];
  var html;

  this.deps = {bootstrap: []};

  this.load = function(callback) {
    html = '<table class="table">';
    html += '<tr><th>Widget Name</th> <th>Deps</th> <th>Tags</th></tr>'
    //html += '<option value="">- Select Widget -</option>';

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      //children.push({title : w.name, copy: 'listing'});
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