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

widgets.home = {
  slots: ['header', 'featured', 'sidebar_first', 'highlighted', 'title', 'tabs', 'help', 'action_links',
    'content', 'sidebar_second', 'triptych',
    'footer_above', 'footer'],
  head: ['/themes/bartik/css/colors.css',
    '/themes/bartik/css/layout.css',
    '/themes/bartik/css/style.css',
    '/themes/bartik/css/system.base.css'],
  load: function(callback) {
    var that = this;
    fs.readFile('themes/bartik/page.html', 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = Handlebars.compile(data);
      callback();
    });
  },
  toHTML: function() {
    return this.template(this);
  }
}