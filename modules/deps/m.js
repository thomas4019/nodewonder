var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async'),
    connect = require('connect');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  middleware: [{base: '/bower_components', func: connect.static('bower_components'), priority: -5}],
  register : function(_cms) {
    cms = _cms;
  }
};
