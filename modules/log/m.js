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

functions.log = function(type, message, data) {
  console.log(type);
}
