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
      console.trace("Here I am!")
      console.log(err);
      error_callback();
      return;
    }
    var jdata = JSON.parse(data);
    var state = jdata[0];
    var rules = jdata[1];
    cms.functions.processRules(rules, function(script, deps) {
      script = '<script>$(function() {' + script + '});</script>';
      state = cms.functions.splitAndFill(state, vars);

      if ('json' in vars) {
          var json = JSON.stringify(state, null, 4);
          //json = json.replace(/\n/g,'</br>');
          //json = json.replace(/\s+/gm, function(spaces) { return spaces.replace(/./g, '&nbsp;'); } );
          callback(json, 'text/javascript');
      } else {
        cms.functions.renderState(state, function(html, content_type, head) {
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

widgets.page_editor = function(input) {
  var page = input.page;
  var state2 = {};

  this.children = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      var jdata = JSON.parse(data);
      var state = jdata[0];
      var rules = jdata[1];

      _.each(state, function(w, key) {
        var parts = key.split(":");
        var _id = parts[0];
        var _type = parts[1];
        w.widget = _type;
        state2[_id + ':' + 'widget_settings'] = w;
      });

      callback({'body' : state2});
    });
  }

  this.script = function() {
    return '$(".zone-drop").sortable({connectWith: ".zone-drop"}); $(".draggable").draggable({connectToSortable: ".zone-drop"});  $( ".droppable" ).droppable({' + 
      'greed: true,' +
      'activeClass: "zone-drop-hover",' +
      'hoverClass: "zone-drop-active",' +
      'tolerance: "pointer",' + 
      'drop: function( event, ui ) { $( this ).addClass("zone-dropped"); }' +
      '}); ';
  }

  this.deps = function() {
    return {'jquery-ui': []};
  }

  this.toHTML = function(zones) {
    return (zones['body'] || '');
  }
}

widgets.page_heirarchy = function (input, id) {
  var children = [];

  page = input.page || 'test2';

  this.head = function() {
    return ['<script type="text/javascript">var state = ' + JSON.stringify(state) + '</script>'];
  }

  this.deps = function() {
    return {'jquery-ui' : [],'dynatree' : ['dist/jquery.dynatree.min.js', 'dist/skin-vista/ui.dynatree.css'], 'order' : ['jquery-ui', 'dynatree']};
  }

  this.load = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      jdata = JSON.parse(data);
      state = jdata[0];

      var toTreeArray = function(w) {
        var element = {title: w.id + ':' + w.name, children : [], expand: true};
        _.each(w.all_children, function(zone_children, zone) {
          var zone_element = {title: zone, isFolder: true, children : [], expand: true};
          _.each(zone_children, function(child) {
            zone_element.children.push(toTreeArray(child));
          });
          element.children.push(zone_element);
        });

        return element;
      }

      cms.functions.organizeState(state, function(widgets_buffer) {
        children.push(toTreeArray(widgets_buffer['start']));
        console.log(widgets_buffer);
        callback();
      });
    });
  }


  this.script = function() {
    return '$("#tree").dynatree({children : ' + JSON.stringify(children) + ', dnd : dnd2});';
  }

  this.toHTML = function(zones, value) {
    return '<div id="tree">123</div>';
  }
}

widgets.widget_listing = function (input, id) {
  var children = [];

  this.head = function() {
    return ['<script src="/modules/forms/data.js" type="text/javascript"></script>'];
  }

  this.deps = function() {
    return {'jquery-ui' : [],'dynatree' : ['dist/jquery.dynatree.min.js', 'dist/skin-vista/ui.dynatree.css'], 'order' : ['jquery-ui', 'dynatree']};
  }

  this.load = function(callback) {

    _.each(cms.widgets, function(widget) {
      w = new widget({});
      children.push({title : w.name, copy: 'listing'});
    });

    callback();
  }


  this.script = function() {
    return 'console.log(data); $("#tree2  ").dynatree({children : ' + JSON.stringify(children) + ', dnd : dnd2});';
  }

  this.toHTML = function(zones, value) {
    return '<div id="tree2">123</div>';
  }
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

  this.script = function() {
    return '';
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