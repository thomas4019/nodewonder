var _ = require('underscore'),
    fs = require('fs');

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

widgets.home = function() {
  this.toHTML = function() {
    return 'hello world';
  }
}