var fs = require('fs'),
    Handlebars = require("handlebars");

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.template = function(input) {
  var that = this;
  this.path = input.path;

  this.zones = function() {
    {name : 'body'};
  }

  this.isPage = function() {
    return true;
  }

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = Handlebars.compile(data);
      callback();
    });
  }

  this.toHTML = function(zones) {
    return this.template(zones);
  }
}

widgets.htmlfile = function(input) {
  var that = this;
  this.path = input.path;

  this.form = function() {
    return  {
      "start:echo" : {"zones" : {"body" : ["path"] }},
      "path:field_text" : {"label" : "path", "value" : input.path}
    };
  }

  this.load = function(callback) {
    fs.readFile(this.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      that.template = data;
      callback();
    });
  }

  this.toHTML = function() {
    return this.template;
  }
}

widgets.centered = function() {
  this.zones = function() {
    return ['content'];
  }

  this.toHTML = function(zones) {
    var template = Handlebars.compile('<div style="margin-left: auto; width: 700px; margin-right: auto; border: 1px solid black; border-radius: 10px; padding: 15px; ">' + 
    ' {{{ content }}} </div>');
    return template(zones);
  }
}