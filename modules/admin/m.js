var fs = require('fs'),
    _ = require('underscore');

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.hello_world = function() {
  this.toHTML = function() {
    return 'Hello World';
  }
}