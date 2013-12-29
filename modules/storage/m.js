var fs = require('fs'),
		_ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
  	cms = _cms;
  }
};
var widgets = module.exports.widgets;

var copy = function (original) {
  return Object.keys(original).reduce(function (copy, key) {
      copy[key] = original[key];
      return copy;
  }, {});
}

widgets.json = function(input) {
	var file = input.file;
	var dir = input.dir || 'storage';
	var widget = input.widget || 'json'
	var values;

	this.deps = function() {
		return {'jquery-form' : {}};
	}

	this.toHTML = function(zones) {
		return '<form class="well" action="/post" method="post">'
		 + '<input type="hidden" name="widget" value="' + widget + '">'
		 + '<input type="hidden" name="file" value="' + file + '">'
		 + '<input type="hidden" name="dir" value="' + dir + '">'
		 + zones['form'] + 
		'</form>';
	}

	this.load = function(callback) {
		fs.readFile(dir + '/' + file + '.json', 'utf8', function(err, data) {
		  if (err) {
		  	console.trace("Here I am!")
		    return console.log(err);
		  }
			values = JSON.parse(data);
			callback();
		});
	}

	this.values = function() {
		return values;
	}

	this.save = function(values) {
		console.log(values);
		delete values['file'];
		fs.writeFile(dir + '/' + file + '.json', JSON.stringify(values, null, 4));
	}
}

widgets.pagejson = function(input) {
	input.widget = 'pagejson';
	var f = new widgets.json(input);

	f.save  = function(values) {
		var widgetValues = cms.m.pages.functions.splitValues(values);

		fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
			if (err) {
				console.trace("Here I am!")
				console.log(err);
			}
			var jdata = JSON.parse(data);
			jdata = cms.m.pages.functions.fillValues(jdata, widgetValues);
		  fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata, null, 4));
		});
	}

	return f;
}