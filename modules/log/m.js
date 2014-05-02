var fs = require('fs'),
    url = require('url'),
    _ = require('underscore');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

widgets.site_log = {
  head: ['/socket.io/socket.io.js', '/modules/log/site_log.js'],
  toHTML: function() {
    return '<h2>Site Activity</h2><div id="log"></div>';
  }
}

functions.log = function(type, message, data) {
  console.log(type);
}