var fs = require('fs'),
    _ = require('underscore'),
    Handlebars = require('Handlebars');

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.two_col = function(input) {
  this.col1 = input.col1 || 6;
  this.col2 = input.col2 || 6;

  var template = Handlebars.compile('<div class="row"><div class="col-sm-6">{{{ left.html }}} ' +
    '</div><div class="col-sm-6">{{{ right.html }}}</div></div>');

  this.deps = {'jquery':[],'bootstrap': []};

  this.toHTML = function(zones) {
    return template(zones);
    //return '<div class="row"><div class="col-sm-' + this.col1 + '">' + zones['left'].html() + 
    //  '</div><div class="col-sm-' + this.col2 + '">' + zones['right'].html() + '</div></div>';
  }

  this.zones = ['left', 'right'];
}

widgets.popup = function() {
	this.zones = ['container'];

  this.form = function() {
    return {
      'resizable' : {'name': 'resizable', 'type': 'field_boolean'},
    };
  }

	this.deps = {'jquery': [], 'jquery-ui': ['themes/smoothness/jquery-ui.min.css', 'themes/smoothness/jquery.ui.theme.css'] };

	this.toHTML = function(zones, id) {
		return '<div id="dialog-confirm" title="Title?">' + 
      '<p>' +
      //'<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>' + 
      zones.container.html() +
      '</p>' +
    '</div>';
  }

	this.script = function() {
		return '$( "#dialog-confirm" ).dialog({ show: { effect: "blind", duration: 1000 }, hide: { effect: "explode", duration: 1000}, resizable: false, modal: true, autoOpen: false, minHeight:"350", height:"auto", minWidth: "500px", width: "auto", buttons: {' +
        '"Ok": function () { $(this).dialog("close"); }, "Cancel": function () { $(this).dialog("close"); }' +
    '}});' + '$("#jHtdjRQt button").click(function() { console.log(1234); $( "#dialog-confirm" ).dialog("open"); });';
	}
}

widgets.tabs = function(input, id) {
  this.zones = ['tabs'];

  this.form = function() {
    return {
      'onmouseover' : {'name': "onmouseover", "type": "field_boolean"}
    };
  }

  this.deps = {'jquery': [], 'jquery-ui': ['themes/smoothness/jquery-ui.min.css', 'themes/smoothness/jquery.ui.theme.css'] };

  this.script = function() {
    var options = {};

    if (input.onmouseover) {
      options['event'] = 'mouseover';
    }

    return '$( "#' + id + '" ).tabs(' + JSON.stringify(options) + ');'
  }

  this.toHTML = function(zones) {
    var html = '<ul>';

    _.each(zones.tabs, function(widget, index) {
      html += '<li><a href="#tabs-' + index + '"> Tab ' + index + '</a></li>';
    });
    html += '</ul>';

    _.each(zones.tabs, function(widget, index) {
      html += '<div id="tabs-' + index + '">' + widget.html() + '</div>';
    });

    return html;
  }
}

widgets.show_bootstrap_popup = function(settings) {
  this.settings = [{"name": "selector", "type": "Text"}]

  this.makeActionJS = function() {
    return '$( "'+settings.selector+'" ).modal("show");';
  }
}

widgets.hide_bootstrap_popup = function(settings) {
  this.settings = [{"name": "selector", "type": "Text"}]

  this.makeActionJS = function() {
    return '$( "'+settings.selector+'" ).modal("hide");';
  }
}

widgets.bootstrap_popup = function(settings) {
  this.zones = ['container', 'buttons'];

  this.settings = [{"name": "resizable", "type": "Boolean"},
    {"name": "title", "type": "Text"}];

  this.deps = {'jquery': [], 'bootstrap': [], 'font-awesome': ['css/font-awesome.min.css'] };

  this.toHTML = function(zones, id) {
    return '' +
    '<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\
      <div class="modal-dialog">\
        <div class="modal-content">\
          <div class="modal-header">\
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
            <h4 class="modal-title" id="myModalLabel">'+settings.title+'</h4>\
          </div>\
          <div class="modal-body">' + 
            zones.container.html() + 
          '</div>\
          <div class="modal-footer">' +
            (zones.buttons ? zones.buttons.html() : '') + 
          '</div>\
        </div>\
      </div>\
    </div>';
  }

  this.script = function() {
    return '$( "#dialog-confirm" ).modal({ show: { effect: "blind", duration: 1000 }, hide: { effect: "explode", duration: 1000}, resizable: false, modal: true, autoOpen: false, minHeight:"350", height:"auto", minWidth: "500px", width: "auto", buttons: {' +
        '"Ok": function () { $(this).modal("close"); }, "Cancel": function () { $(this).modal("close"); }' +
    '}});';
  }
}