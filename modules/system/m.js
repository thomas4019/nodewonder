var Handlebars = require('handlebars'),
  moment = require('moment'),
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
functions = module.exports.functions;

functions.makeid = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

functions.fillSettings = function(settings, scope, exclude) {
  exclude = exclude || ['data'];
  _.each(settings, function(value, key) {
    if (value && (typeof value === 'string') && value.indexOf("{{") != -1 && (!_.contains(exclude, key))) {
      var template = Handlebars.compile(value);
      settings[key] = template(scope);
    }
  })
}

widgets.render_widget = {
  wrapper: 'none',
  children: function(callback) {
    var widget_input = (this.settings.input) ? JSON.parse(this.settings.input) : {};

    var values = {};
    if (input.values) {
      values = JSON.parse(this.settings.values);
    }

    var body = {};
    body['sel'] = {'type': this.settings.widget_type, 'settings': widget_input}
    callback({'body': body});
  },
  toHTML: function() {
    return this.renderSlot('body');
  }
}

widgets.widgets_view = {
  settingsModel: [{"name": "model", "type": "Record", "settings": {"model": "model"}},
    {"name": "record", "type": "Text"},
    {"name": "field", "type": "Text"}],
  children: function(callback) {
    var settings = this.settings;
    cms.functions.getRecord(settings.model, settings.record, function(err, data) {
      var code = data[settings.field];
      console.log(code);
      _.each(code.widgets, function(widget) {
        if (widget.model && widget.field) {
          widget.settings = widget.settings || {};
        }
      });
      callback({'body': code.widgets}, code.slotAssignments);
    });
  },
  toHTML: function() {
    return this.renderSlot('body');
  }
}

widgets.header = {
  wrapper: function() {
    return this.settings.type || 'h1';
  },
  tags: ['field_view'],
  settingsModel: [{"name": "data", "type": "Text"},
      {"name": "type", "type": "Text"}],
  toHTML: function() {
    return this.settings.data;
  }
}

widgets.plaintext =  {
  wrapper: 'p',
  tags: ['field_view'],
  settingsModel: [{"name": "data", "type": "Text"}],
  toHTML: function() {
    return this.settings.data;
  }
}

widgets.filtered_html = {
  wrapper: 'p',
  tags: ['field_view'],
  settingsModel: [{"name": "data", "type": "Text"}],
  toHTML: function() {
    return this.settings.data;
  }
}

widgets.formatted_date = {
  tags: ['field_view'],
  settingsModel: [{"name": "format", "type": "Text"},
    {"name": "data", "type": "Date"}],
  toHTML: function() {
    return moment(this.settings.data).format(this.settings.format || 'MMMM Do YYYY');
  }
}

widgets.yes_no = {
  tags: ['field_view'],
  settingsModel: [{"name": "true_text", "type": "Text"},
    {"name": "false_text", "type": "Text"},
    {"name": "data", "type": "Boolean"}],
  toHTML: function() {
    return this.settings.data ? (this.settings.true_text || 'Yes') : (this.settings.false_text || 'No');
  }
}