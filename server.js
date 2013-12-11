var http = require('http');
var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets;

var fs = require('fs'),
    connect = require('connect'),
    Handlebars = require("handlebars"),
    director = require('director'),
    coffee = require('coffee-script'),
    querystring = require('querystring'),
    _ = require('underscore'),
    async = require('async'),
    file = require('file');

var cms = {};
cms.m = {};
cms.widgets = {};

registerModule('admin');
registerModule('widget');
registerModule('theme');
registerModule('forms');

//var w = new cms.widgets.two_col;
//console.log(w.toHTML());

var menu;

fs.readFile('menu.html', 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  menu = data;
});

function registerModule(module) {
  var m = require('./modules/' + module + '/m');
  cms.m[module] = m;
  m.widgets.forEach(function(v) {cms.widgets[v.prototype.name] = v; }, this);    
}

function page(html) {
  return templates['admin']({body: html, admin_menu: menu});
}

function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            response.post = querystring.parse(queryData);
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}

var save = function() {
  var that = this;
  var widget = new cms.widgets['setting']({'file' : this.res.post['form']});
  delete this.res.post['form'];
  widget.load(function () {;
    widget.save(that.res.post);
  });
  this.res.writeHead(204);
  this.res.end();
}

var router_error = function(err) {
  if (err) {
    this.res.writeHead(404);
    this.res.end('404');
  }
}

/*var state = {
  n : 'template', i : {path : 'admin.html'}, c : {
    'body' : [{n : 'setting', i : {file : 'info'}}],
    'top' : [{n : 'htmlfile', i : {path : 'menu.html'}}],
  }
};*/

/*var state = {
  n : 'template', i : {path : 'themes/html5up-tessellate/template.html'}, c : {
    'title' : [{n : 'hello_world'}],
    'top' : [{n : 'htmlfile', i : {path : 'menu.html'}}],
    'header' : [{n : 'setting', i : {file : 'maintenance'}}],
  }
};*/

var widget_start;
var widgets_buffer = [];

var view = function() {
  var that = this;
  if (this.req.url == '/') {
    this.req.url = 'index'
  }
  fs.readFile('pages/' + this.req.url + '.json', 'utf8', function(err, data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
    var jdata = JSON.parse(data);
    console.log(jdata);
    render(that.req, that.res, jdata);
  });
}

var render = function(req, res, state) {
  widget_start = widgetRecur(state, widget_start);

  count = 0;
  target = widgets_buffer.length;

  var head = '';
  var onready = '';

  var toHTML = function(widget) {
    var zones = {};

    if (widget.head) {
      head += widget.head();
    }

    if (widget.onReady) {
      onready += widget.onReady(widget.name);
    }

    _.each(widget.children, function(widgetList, zone) {
      var zone_html = '';

      _.each(widgetList, function(w, i) {
        zone_html += toHTML(w);
      });

      zones[zone] = zone_html;
    });

    head += '<script>$(function() {' + onready + '});</script>';

    console.log(head);

    if (widget.isPage) {
      zones['head'] = head;
      return widget.toHTML(zones);
    } else {
      console.log(widget.name);
      return '<div class="widget-container widget-' + widget.name + '" id="' + widget.name + '">' + widget.toHTML(zones) + '</div>';
    }
  }

  var widget_ready = function(widget) {
    count++;
    console.log(count);
    if (count == target) {
      console.log('ready');
      var html = toHTML(widget_start);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html)
    }
  }

  async.each(widgets_buffer, function(w) {
    if (w.load)
      w.load(widget_ready);
    else
      count++;
  });
}

var widgetRecur = function(state) {
  console.log('-----' + state.n + ' ' + state.i);
  var widget = new cms.widgets[state.n](state.i);
  widgets_buffer.push(widget);

  widget.children = {};
  if (state.c) {
    _.each(state.c, function(widgetList, zone) {
      if (!widget.children[zone]) {
        widget.children[zone] = [];
      }
      _.each(widgetList, function(w, i) {
        var sub = widgetRecur(w);
        widget.children[zone].push(sub);
        sub.parent = widget;
      });
    });
  }

  return widget;
}

var show_widget = function() {
  var widget = new cms.widgets['template'];
  this.res.writeHead(200, {'Content-Type': 'text/html'});
  var that = this;
  var onready = function() {
    var out = widget.toHTML();
    var out_html;
    if (out instanceof Array) { 
      out_html = out.join('');
    } else {
      out_html = out;
    }
    that.res.end(out_html);
  };
  if (widget.load) {
    widget.load('themes/html5up-tessellate/template.html', onready);
    //widget.load('admin.html', onready);
  }
  else {
    onready();
  }
}

var router = new director.http.Router({
  //'/': {get: main},
  //'/admin/config/' : {get: setting_form},
  '/test/' : {get: show_widget},
  '/render/' : {get: render},
});

router.on('post', '/save', save);
router.on('get', '/', view);

function loadPages() {
  file.walk('pages', function(test, dirPath, dirs, files) {
    _.each(files, function(file, index) {      
      var last_dot = file.lastIndexOf('.');
      var ext = file.substring(last_dot + 1, file.length);
      if (file.charAt(0) !== '.' && file.indexOf("/.") === -1 && ext == 'json') {
        var path = file.substring(6, last_dot);
        router.on('get', path, view);
      }
    });
  });
}

loadPages();

var app = connect()
  .use(connect.static('themes/html5up-tessellate/'))
  .use('/files', connect.static('files'))
  .use('/modules', connect.static('modules'))
  .use(function (req, res) {
    if (req.method == 'POST') {
      processPost(req, res, function() {
        router.dispatch(req, res, router_error);
      });
    } else {
      router.dispatch(req, res, router_error);
    }
  });

http.createServer(app).listen(80);

console.log('Server running at http://127.0.0.1/');
