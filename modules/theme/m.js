var fs = require('fs'),
    Handlebars = require("handlebars");

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.template = {
  slots: ['body'],
  wrapper: 'none',
  settingsModel: [ {"name" : "path", "type": "Text"} ],
  load: function(callback) {
    var that = this;
    fs.readFile(this.settings.path, 'utf8', function(err, data) {
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

widgets.htmlfile = {
  settingsModel: [ {"name": "path", "type": "Text"} ],
  load: function(callback) {
    var that = this;
    fs.readFile(this.settings.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = data;
      callback();
    });
  },
  toHTML: function() {
    return this.template;
  }
}

widgets.centered = {
  slots: ['content'],
  toHTML: function() {
    var template = Handlebars.compile('<div style="margin-left: auto; width: 700px; margin-right: auto; border: 1px solid black; border-radius: 10px; padding: 15px; ">' + 
    ' {{{ renderSlot "content" }}} </div>');
    return template(this);
  }
}