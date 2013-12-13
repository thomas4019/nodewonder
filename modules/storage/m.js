var fs = require('fs'),
		_ = require('underscore');

module.exports = {
	widgets : {}
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

	this.head = function() {
		return '<script src="http://malsup.github.com/jquery.form.js"></script>';
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
		fs.writeFile(dir + '/' + file, JSON.stringify(values, null, 4));
	}
}

var splitValues = function(values) {
	var widgetValues = {};

	_.each(values, function(value, key) {
		var parts = key.split("-");
		if (parts.length == 2) {
	    var widget_id = parts[0];
	    var value_id = parts[1];

	    if (!widgetValues['widget_id']) {
	    	widgetValues[widget_id] = {};
	    }

	    widgetValues[widget_id][value_id] = value;
	  }
  });

  return widgetValues;
}

var fillValues = function(state, values) {
  _.each(state, function(w, key) {
    var parts = key.split(":");
    var _id = parts[0];
    var _type = parts[1];
  	if (values[_id]) {
  		state[key] = _.extend(w, values[_id]);
  	}
  });

  return state;
}

widgets.pagejson = function(input) {
	input.widget = 'pagejson';
	var f = new widgets.json(input);

	f.save  = function(values) {
		var widgetValues = splitValues(values);

		fs.readFile(input.dir + '/' + input.file, 'utf8', function(err, data) {
			if (err) {
				console.log(err);
			}
			var jdata = JSON.parse(data);
			jdata = fillValues(jdata, widgetValues);
		  fs.writeFile(input.dir + '/' + input.file, JSON.stringify(jdata, null, 4));
		});
	}

	return f;
}