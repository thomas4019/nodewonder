var path = require('path'),
    _ = require('underscore'),
    fs = require('fs'),
    dive = require('dive'),
    mkdirp = require('mkdirp');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
var widgets = module.exports.widgets; 
var functions = module.exports.functions;

functions.pageToStatic = function(fpath) {
  fs.readFile('pages/' + fpath + '.json', 'utf8', function(err, data) {
    if (err) {
      console.trace("Here I am!")
      return console.log(err);
    }
    console.log('static: ' + fpath);
    //TODO: Update this code below
    var jdata = JSON.parse(data);
    var state = jdata[0];
    var rules = jdata[1];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>'
      console.log('- ' + fpath);
      cms.functions.renderState(state, {}, function(html) {
        mkdirp(path.dirname('static/' + fpath), function(err) { 
          fs.writeFile('static/' + fpath  + '.html', html);
        });
      }, script, deps); //'<base href="http://localhost:3000/" target="_blank" >'
    });
  });
}

functions.allPagesToStatic = function() {
  dive('pages', {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative('pages',file).slice(0, -ext.length);
    if (ext == '.json') {
      cms.functions.pageToStatic(pa);
    }
  });
}

//http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
functions.copyFile = function(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

functions.staticThemeCopy = function() {
  var theme = 'themes/html5up-tessellate/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    mkdirp(path.dirname('static/' + pa), function(err) { 
      cms.functions.copyFile(file, 'static/' + pa, function() {

      });
    });
  });
}

functions.staticModulesCopy = function() {
  var theme = 'modules/';
  dive(theme, {}, function(err, file) {
    var ext = path.extname(file);
    var pa = path.relative(theme, file);
    if (ext == '.css' || ext == '.js' && pa.substr(pa.length - 4) != 'm.js') {
      mkdirp(path.dirname('static/' + pa), function(err) { 
        cms.functions.copyFile(file, 'static/' + pa, function() {

        });
      });
    }
  });
}