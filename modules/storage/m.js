var fs = require('fs'),
    _ = require('underscore'),
    mkdirp = require('mkdirp'),
    path = require('path');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var functions = module.exports.functions;
var widgets = module.exports.widgets;

functions.wrapInForm = function(html, widget, vars) {
  var out = '<form action="/post" method="post">'
   + '<input type="hidden" name="widget" value="' + widget + '">';

  _.each(vars, function(value, key) {
    out += '<input type="hidden" name="' + key + '" value="' + value + '">';
  });
  out += html;
  out += '</form>';

  return out;
}

var copy = function (original) {
  return Object.keys(original).reduce(function (copy, key) {
      copy[key] = original[key];
      return copy;
  }, {});
}