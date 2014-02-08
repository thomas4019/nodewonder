var _ = require('underscore'),
    fs = require('fs'),
    Handlebars = require('handlebars');

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
  var template;

  this.zones = function() {
    return ['header', 'featured', 'sidebar_first', 'highlighted', 'title', 'tabs', 'help', 'action_links',
    'content', 'sidebar_second', 'triptych',
    'footer_above', 'footer'];
  }

  this.load = function(callback) {
    fs.readFile('themes/bartik/page.html', 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      template = Handlebars.compile(data);
      callback();
    });
  }

  this.head = function() {
    return ['<link type="text/css" rel="stylesheet" href="themes/bartik/css/colors.css" />',
    '<link type="text/css" rel="stylesheet" href="themes/bartik/css/layout.css" />',
    '<link type="text/css" rel="stylesheet" href="themes/bartik/css/style.css" />',
    '<link type="text/css" rel="stylesheet" href="themes/bartik/css/system.base.css" />'];
  }

  this.toHTML = function(zones) {
    return template(zones);
  }
}