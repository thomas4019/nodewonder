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
    return console.error(err);
  }
  page_template = Handlebars.compile(data);
});

/* This takes in a template and 
 */
functions.loadPageState = function(path, callback) {
  cms.functions.getRecord('custom_page', path, function(err, page) {
    //console.log('l: ' + path + "=" + err);
    if (err) {
      //console.log(err);
      callback(err, page);
      return;
    }

    if (page.controller && typeof(page.controller) == "string") {
      page.controller = [page.controller];
    } else {
      page.controller = [];
    }

    //console.log('loading: ' + path);
    //console.log(page);
    //console.log(err);
    if (page.parent) {
      cms.functions.loadPageState(page.parent, function(err, parent) {
        //here we do the merge
        if (err || !parent) {
          console.error('missing parent');
          console.error(err);
        }
        var combined = dextend(parent, page);
        combined.controller = parent.controller.concat(page.controller);

        _.each(combined.code.slotAssignments, function(value, key) {
          if (key.indexOf(':') !== -1) {
            var parts = key.split(":");
            //console.log(parts);
            var slots = combined.code.widgets[parts[0]].slots;
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
  if (path == '') {
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

    if (page.controller && page.controller.length > 0) {
      //eval(page.controller);
      var i = 0;  
      context['widgets'] = page.code.widgets;
      context['slotAssignments'] = page.code.slotAssignments;
      context['scope'] = page.scope;
      context['scope']['args'] = vars;
      context['args'] = vars;
      context['callback'] = function() {
        i++;
        if (i == page.controller.length) {
          cms.functions.renderPage(page, vars, callback);
        } else {
          vm.runInContext(page.controller[i], context);
        }
      }
      vm.runInContext(page.controller[0], context);
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
      var json = JSON.stringify(page.code.widgets, null, 4);
      callback(json, 'text/javascript');
  } else if ('processedjson' in vars) {
      cms.functions.initializeState(page.code.widgets, page.scope, function(widgets_buffer, results, state) {
        var json = JSON.stringify(state, null, 4);
        callback(json, 'text/javascript');
      });
  } else if ('scope' in vars) {
    var json = JSON.stringify(page.scope, null, 4);
    callback(json, 'text/javascript');
  } else if ('vars' in vars) {
    var json = JSON.stringify(vars, null, 4);
    callback(json, 'text/javascript');
  } else if ('raw' in vars) {
    cms.functions.renderStateParts(page.code.widgets, page.code.slotAssignments, function(html, results) {
      var head = results.head;
      head = head.concat(cms.functions.processDeps(results.deps));
      /*encoded_head = _.map(encoded_head, function (element) {
        return element.replace(/<\/script/g, '</scr"+"ipt');
      });*/
      var out = {};
      out['html'] = html;
      out['head'] = head;
      out['javascript'] = results.script;
      var json_out = JSON.stringify(out, 0, 4);
      callback(json_out, 'text/javascript');
    }, page.scope);
  } else {
    cms.functions.renderState(page.code.widgets, page.code.slotAssignments, function(html, head) {
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