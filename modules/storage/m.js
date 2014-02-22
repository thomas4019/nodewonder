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

widgets.json = function(input) {
  var file = input.file;
  var dir = input.dir || 'storage';
  var widget = input.widget || 'json'
  var values;

  this.deps = {'jquery' : []};

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="file" value="' + file + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones.form.html() + 
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

  this.deps = {'jquery' : []};

  this.toHTML = function(zones) {
    return '<form class="well" action="/post" method="post">'
     + '<input type="hidden" name="widget" value="' + widget + '">'
     + '<input type="hidden" name="id" value="' + input.id + '">'
     + '<input type="hidden" name="dir" value="' + dir + '">'
     + zones.form.html() + 
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
      jdata.widgets = cms.m.pages.functions.fillValues(jdata.widgets, widgetValues);
      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata.widgets, null, 4));
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
        console.log("JSON file doesn't exist");
        current_state = {};
        //console.log(err);
        callback();
        return;
      }
      var jdata = JSON.parse(data);
      current_state = jdata;
      callback();
    });
  }

  f.values = function() {
    return {'editor': current_state};
  }

  f.save  = function(values) {
    fs.readFile(input.dir + '/' + input.file + '.json', 'utf8', function(err, data) {
      var jdata;
      if (err) {
        console.log("JSON file doesn't exist")
        //console.log(err);
        jdata = {};
      } else {
        jdata = JSON.parse(data);
      }
      var newData = JSON.parse(values['state']);
      jdata.widgets = newData.widgets;
      jdata.slotAssignments = newData.slotAssignments;
      console.log('hello');
      console.log(newData);
      console.log(JSON.stringify(jdata));
      console.log(input.dir + '/' + input.file + '.json');

      mkdirp(path.dirname(input.dir + '/' + input.file + '.json'), function(err) {

      });

      fs.writeFile(input.dir + '/' + input.file + '.json', JSON.stringify(jdata, null, 4));
    });
  }

  return f;
}