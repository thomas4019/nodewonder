var Handlebars = require('handlebars'),
  moment = require('moment');

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

widgets.header = function(input, id, scope) {
  this.wrapper = input.type || 'h1';

  this.view = 'Text';

  this.settings = function() {
    return [{"name": "data", "type": "Text"}];
  }

  this.toHTML = function(slots) {
    var text = Handlebars.compile(input.data);
    return text(scope);
  }
}

widgets.plaintext =  function(input, id) {
  this.wrapper = 'p';

  this.view = 'Text';

  this.settings = [{"name": "data", "type": "Text"}];

  this.toHTML = function(slots) {
    return input.data;
  }
}

widgets.filtered_html =  function(input, id) {
  this.wrapper = 'p';

  this.view = 'Text';

  this.settings = [{"name": "data", "type": "Text"}];

  this.toHTML = function(slots) {
    return input.data;
  }
}

widgets.render_widget = function(input) {
  var values = {};

  widget_input = (input.input) ? JSON.parse(input.input) : {};

  if (input.values) {
    values = JSON.parse(input.values);
  }

  this.wrapper = 'none';

  this.children = function(callback) {
    var body = {};
    body['sel'] = {'type': input.widget_type, 'settings': widget_input}
    callback({'body': body});
  }

  this.toHTML = function(slots, value) {
    return slots['body'].html();
  }
}

widgets.formatted_date = function(settings) {
  this.view = 'Date';

  this.settings = [{"name": "format", "type": "Text"}];

  this.toHTML = function() {
    return moment(settings.data).format(settings.format || 'MMMM Do YYYY');
  }
}

widgets.yes_no = function(settings) {
  this.view = 'Boolean';

  this.settings = [{"name": "true_text", "type": "Text"},
    {"name": "false_text", "type": "Text"}];

  this.toHTML = function() {
    return settings.data ? settings.true_text || 'Yes' : settings.false_text || 'No';
  }
}