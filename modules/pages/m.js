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
      if (path.lastIndexOf('/', path.length - 3) === -1 || path == '/%') {
        error_callback();
      } else {
        var index = path.lastIndexOf('/', path.length - 3);
        var arg = path.substring(index + 1);
        vars['arg'] = arg;
        path = path.substring(0, index + 1) + '%';
        console.log('searching: ' + path);
        cms.functions.viewPage(path, vars, callback, error_callback);
      }
      return;
    }
    var page = JSON.parse(data);
    var state = page.widgets;
    var slotAssignments = page.slotAssignments;
    console.log(page.arguments);
    if (page.arguments) {
      _.each(page.arguments, function(input, id) {
        _.each(input, function(arg, name) {
          vars[id + '-' + name] = vars['arg'];
          console.log(id + '-' + name + '=' + vars['arg']);
        });
      });
    }

    state = cms.functions.splitAndFill(state, vars);

    if ('json' in vars) {
        var json = JSON.stringify(state, null, 4);
        callback(json, 'text/javascript');
    } else if ('processedjson' in vars) {
        cms.functions.initializeState(state, function(widgets_buffer, state) {
          var json = JSON.stringify(state, null, 4);
          callback(json, 'text/javascript');
        });
    } else {
      cms.functions.renderState(state, slotAssignments, function(html, head) {
        var content_type = page.contentType ? page.contentType : 'text/html';
        head.unshift('<script type="text/javascript" src="/modules/admin/nw.js"></script>')
        if (content_type == 'text/html') {
          var encoded_head = JSON.stringify(head);
          encoded_head = encoded_head.replace(/<\/script/g, '</scr"+"ipt');
          var head_meta = '<script type="text/javascript">var head = ' + encoded_head + ';</script>';
          head.push(head_meta);
          var html = page_template({
            'head': head.join('\n'),
            'body': html
          });
        }
        callback(html, content_type);
      });
    }

  });
}