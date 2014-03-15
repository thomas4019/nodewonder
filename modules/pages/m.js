var _ = require('underscore'),
    fs = require('fs'),
    async = require('async'),
    file = require('file'),
    dive = require('dive'),
    path = require('path'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require("handlebars"),
    vm = require("vm");

var cms;
var context;

module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;

    initSandbox = {
      animal: 'cat',
      count: 2,
      load: cms.functions.loadRecord,
      loadPage: functions.loadPageState
    },
    context = vm.createContext(initSandbox);
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

/* This takes in a template and 
 */
functions.loadPageState = function(path, callback) {
  fs.readFile('pages/' + path + '.json', 'utf8', function(err, data) {
    if (err) {
      //console.log(err);
      callback(err, data);
      return;
    }

    var page = JSON.parse(data);

    if (page.parent) {
      cms.functions.loadPageState(page.parent, function(err, parent) {
        //here we do the merge
        var combined = dextend(parent, page);
        _.each(combined.slotAssignments, function(value, key) {
          if (key.indexOf(':') !== -1) {
            var parts = key.split(":");
            //console.log(parts);
            var slots = combined.widgets[parts[0]].slots;
            slots[parts[1]] = value;
          }
        });
        //console.log(combined);
        callback(err, combined);
      });

    } else {
      callback(err, page);
    }
  });
}

functions.viewPage = function(path, vars, callback, error_callback) {
  if (path == '/') {
    path = 'index'
  }
  cms.functions.loadPageState(path, function(err, page) {
    if (err) {
      if (path.lastIndexOf('/', path.length - 3) === -1 || path == '/%') {
        error_callback();
      } else {
        var last = path.substring(path.length - 2);
        var count = path.split('/').length - 1;
        var end = path.length;
        if (last == '/%') {
          count--;
          end -= 2;
        }
        var index = path.lastIndexOf('/', end - 1);

        var arg = path.substring(index + 1, end);
        vars['arg' + count] = arg;
        path = path.substring(0, index + 1) + '%';
        //console.log(vars);
        //console.log(last);
        //console.log('searching: ' + path);
        cms.functions.viewPage(path, vars, callback, error_callback);
      }
      return;
    }

    //cms.functions.processInheritance(rawPage, function(page) {

    var state = page.widgets;
    //console.log(page.arguments);
    if (page.arguments) {
      _.each(page.arguments, function(input, id) {
        _.each(input, function(arg, name) {
          vars[id + '-' + name] = vars['arg' + arg];
          //console.log(id + '-' + name + '=' + vars['arg' + arg]);
        });
      });
    }

    page.scope = {};

    if (page.controller) {
      //eval(page.controller);
      context['widgets'] = state;
      context['scope'] = page.scope;
      context['args'] = vars;
      context['callback'] = function() {
        cms.functions.renderPage(page, vars, callback);
      }
      vm.runInContext(page.controller, context);
      //console.log(util.inspect(context));
      page.scope = context.scope;
    } else {
      cms.functions.renderPage(page, vars, callback);  
    }

  });
}

functions.renderPage = function(page, vars, callback) {
  page.widgets = cms.functions.splitAndFill(page.widgets, vars);

  if ('json' in vars) {
      var json = JSON.stringify(page.widgets, null, 4);
      callback(json, 'text/javascript');
  } else if ('processedjson' in vars) {
      cms.functions.initializeState(page.widgets, function(widgets_buffer, state) {
        var json = JSON.stringify(state, null, 4);
        callback(json, 'text/javascript');
      });
  } else if ('scope' in vars) {
    var json = JSON.stringify(page.scope, null, 4);
    callback(json, 'text/javascript');
  } else if ('vars' in vars) {
    var json = JSON.stringify(vars, null, 4);
    callback(json, 'text/javascript');
  } else {
    cms.functions.renderState(page.widgets, page.slotAssignments, function(html, head) {
      var content_type = page.contentType ? page.contentType : 'text/html';
      head.unshift('<script type="text/javascript" src="/modules/admin/nw.js"></script><link rel="stylesheet" href="/modules/admin/nw.css"></link>')
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
    }, page.scope);
  }
}