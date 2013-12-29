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
  async.each(Object.keys(deps), function(dep, callback2) {
    var depDetail = deps[dep];
    cms.functions.processDep(dep, function(html) {
      head += html;
      callback2();
    });
  }, function(err) {
    callback(head);
  });
}

functions.processDep = function(dep, callback) {
	var folder = 'bower_components/' + dep + '/';

	bowerJson.read(folder + 'bower.json', function (err, json) {
    if (err) {
        console.error(err.message);
        return;
    }

    var html = '';
    _.each(json.main, function(file, index) {
    	html += cms.functions.fileToHTML('/' + folder, file);
    });

    callback(html);
    console.log('JSON: ', json);
});
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