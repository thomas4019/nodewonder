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
functions = module.exports.functions;

functions.processDeps = function(deps) {
  if (!deps) {
    return '';
  }
  var order = deps['order'];
  delete deps['order'];
  if (order)
    order = _.union(order, Object.keys(deps));
  else
    order = Object.keys(deps);
  var head = [];
  _.each(order, function(dep, index) {
    var depFiles = _.union(cms.deps[dep], deps[dep]);;
    head.push(cms.functions.processDep(dep, depFiles));
  });

  return head;
}

functions.processDep = function(dep, depFiles) {
  var folder = 'bower_components/' + dep + '/';

  var html = '';
  _.each(depFiles, function(file, index) {
    if (file) {
      html += cms.functions.fileToHTML('/' + folder, file);
    }
  });
  return html;
}

functions.fileToHTML = function(folder, file) {
  if (!file || typeof file !== 'string') {
    console.log('invalid dependency:' + folder + ' ' + JSON.stringify(file));
    return;
  }
  var ext = file.split('.').pop();
  var full = folder + file;
  if (ext == 'js') {
    return '<script type="text/javascript" src="' + full + '"></script>\n';
  } else if (ext == 'css') {
    return '<link rel="stylesheet" href="' + full + '" />\n';
  } else {
    return '';
  }
}
