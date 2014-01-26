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
		return {'jquery-form' : []};
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

widgets.ijson = function(input) {
	var dir = input.dir || 'storage/survey';
	var widget = input.widget || 'ijson'
	var values;

	this.deps = function() {
		return {'jquery-form' : []};
	}

	this.toHTML = function(zones) {
		return '<form class="well" action="/post" method="post">'
		 + '<input type="hidden" name="widget" value="' + widget + '">'
		 + '<input type="hidden" name="id" value="' + input.id + '">'
		 + '<input type="hidden" name="dir" value="' + dir + '">'
		 + zones['form'] + 
		'</form>';
	}

	this.load = function(callback) {
		if (typeof input.id !== 'undefined' && input.id != 'undefined') {
			fs.readFile(dir + '/' + (input.id) + '.json', 'utf8', function(err, data) {
			  if (err) {
			  	console.trace("Here I am!")
			    return console.log(err);
			  }
				values = JSON.parse(data);
				console.log(values);
				callback();
			});
		} else {
			callback();
		}
		
	}

	this.values = function() {
		return values;
	}

	this.save = function(values) {
		console.log('-------');
		delete values['file'];
		delete values['dir'];
		var id = (typeof values.id !== 'undefined' && values.id != 'undefined') ? values.id : (widgets.ijson.counter++);
		delete values['id'];
		fs.writeFile(dir + '/' + id  + '.json', JSON.stringify(values, null, 4));
	}
}
widgets.ijson.init = function() {
	widgets.ijson.counter = 0;
  var files = fs.readdirSync('storage/survey');
  _.each(files, function(file) {
    var current = parseInt(file.split('.')[0]);
    if (current > widgets.ijson.counter) {
    	widgets.ijson.counter = current + 1
    }
  });
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
	    var state = jdata[0];
	    var rules = jdata[1];
			state = cms.m.pages.functions.fillValues(state, widgetValues);
		  fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify([state, rules], null, 4));
		});
	}

	return f;
}

widgets.statejson = function(input) {
	input.widget = 'statejson';
	var f = new widgets.json(input);
	var current_state;

	f.load = function(callback) {
		fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
		  if (err) {
		  	console.trace("Here I am!")
		    return console.log(err);
		  }
	    var jdata = JSON.parse(data);
	    current_state = jdata[0];
			callback();
		});
	}

	f.values = function() {
		return {'state': current_state};
	}

	f.save  = function(values) {
		fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
			if (err) {
				console.trace("Here I am!")
				console.log(err);
			}
	    var jdata = JSON.parse(data);
	    var state = jdata[0];
	    var rules = jdata[1];
	    state = JSON.parse(values['state']);
		  fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify([state, rules], null, 4));
		});
	}

	return f;
}