var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require("handlebars"),
    vm = require("vm"),
    url = require("url");

var cms;
var context;

module.exports = {
  widgets : {},
  functions : {},
  middleware: [{func: customPageMiddleware, priority: 0}],
  register : function(_cms) {
    cms = _cms;
  },
};

function customPageMiddleware(req, res, next) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var path = url_parts.pathname.substring(1);

  var scope = {};
  scope.user = req.user;

  cms.functions.viewPage(path, query, scope, function(page, vars) {

    cms.functions.renderPage(page, vars, function(html, content_type, code) {
      res.writeHead(code || 200, {'Content-Type': content_type});
      res.end(html);
    });
  }, next);
}
