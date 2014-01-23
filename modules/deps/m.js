var _ = require('underscore'),
		bowerJson = require('bower-json'),
		path = require('path'),
		async = require('async');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
  	cms = _cms;
  }
};
functions = module.exports.functions;

functions.processDeps = function(deps, callback) {
  var head = ''
  if (!deps) {
    callback();
    return;
  }
  var order = deps['order'];
  delete deps['order'];
  order = _.union(order, Object.keys(deps));
  _.each(order, function(dep, index) {
    var depFiles = _.union(cms.deps[dep], deps[dep]);
    head += cms.functions.processDep(dep, depFiles);
  });

  callback(head);
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
	var ext = file.split('.').pop();
	var full = folder + file;
	if (ext == 'js') {
		return '\n<script type="text/javascript" src="' + full + '"></script>';
	} else if (ext == 'css') {
		return '\n<link rel="stylesheet" href="' + full + '" />';
	} else {
		return '';
	}
}