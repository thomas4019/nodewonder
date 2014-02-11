var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require("handlebars");

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

var page_template;

fs.readFile('page.html', 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  page_template = Handlebars.compile(data);
});

functions.viewPage = function(path, vars, callback, error_callback) {
  if (path == '/') {
    path = 'index'
  }
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      //console.log(err);
      error_callback();
      return;
    }
    var jdata = JSON.parse(data);
    var state = jdata.widgets;
    var slotAssignments = jdata.slotAssignments;
    var rules = jdata.rules || [];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>';
      state = cms.functions.splitAndFill(state, vars);

      if ('json' in vars) {
          var json = JSON.stringify(state, null, 4);
          //json = json.replace(/\n/g,'</br>');
          //json = json.replace(/\s+/gm, function(spaces) { return spaces.replace(/./g, '&nbsp;'); } );
          callback(json, 'text/javascript');
      } else {
        cms.functions.renderState(state, slotAssignments, function(html, head) {
          var content_type = jdata.contentType ? jdata.contentType : 'text/html';

          if (content_type == 'text/html') {
            var encoded_head = JSON.stringify(head);
            encoded_head = encoded_head.replace(/<\/script/g, '</scr"+"ipt');
            var head_meta = '<script type="text/javascript">var head = ' + encoded_head + ';</script>';
            head.push(head_meta);
            var html = page_template({
              'head': head.join('\n') + script,
              'body': html
            });
          }
          callback(html, content_type);
        }, script, deps);
      }
    });
  });
}

widgets.echo = function(input) {
}

widgets.page_listing = function(input) {
  var paths = [];

  this.load = function(callback) {
    dive('pages', {}, function(err, file) {
      var pa = path.relative('pages',file).slice(0, -5);
      var ext = path.extname(file);
      if (ext == '.json') {
        paths.push(pa);
      }
    }, callback);
  }

  this.toHTML = function() {
    var html = '<h1>Pages</h1><ul class="list-group">';
    _.each(paths, function(path, index) {
      var edit_path = 'admin/pages/edit?storage-file=' + path + '&editor-page=' + path + '&preview-url=/' + path;
      html += '<li class="list-group-item" >' +
      '<a href="/' + edit_path + '"><span class="glyphicon glyphicon-edit"></span></a> ' +
      '<a href="/' + path + '">' + path + '</a></li>';
    });
    html += '</ul>';
    return html;
  }
}