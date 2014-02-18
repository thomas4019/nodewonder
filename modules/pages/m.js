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
    var page = JSON.parse(data);
    var state = page.widgets;
    var slotAssignments = page.slotAssignments;

    state = cms.functions.splitAndFill(state, vars);

    if ('json' in vars) {
        var json = JSON.stringify(state, null, 4);
        callback(json, 'text/javascript');
    } else {
      cms.functions.renderState(state, slotAssignments, function(html, head) {
        var content_type = page.contentType ? page.contentType : 'text/html';

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