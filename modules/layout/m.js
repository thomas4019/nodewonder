var fs = require('fs'),
    _ = require('underscore'),
    Handlebars = require('Handlebars');

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.two_col = {
  deps: {'jquery':[],'bootstrap': []},
  slots: ['left', 'right'],
  toHTML: function() {
    var template = Handlebars.compile('<div class="row"><div class="col-sm-6">{{{ renderSlot "left" }}} ' +
    '</div><div class="col-sm-6">{{{ renderSlot "right" }}}</div></div>');
    return template(this);
  }
}

widgets.popup = {
	slots: ['container'],
  settings: [{'name': 'resizable', 'type': 'Boolean'}],
	deps: {'jquery': [], 'jquery-ui': ['themes/smoothness/jquery-ui.min.css', 'themes/smoothness/jquery.ui.theme.css'] },
	toHTML: function() {
		return '<div id="dialog-confirm" title="Title?">' + 
      '<p>' +
      //'<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>' + 
      this.renderSlot('container'); +
      '</p>' +
    '</div>';
  },
  script: function() {
		return '$( "#dialog-confirm" ).dialog({ show: { effect: "blind", duration: 1000 }, hide: { effect: "explode", duration: 1000}, resizable: false, modal: true, autoOpen: false, minHeight:"350", height:"auto", minWidth: "500px", width: "auto", buttons: {' +
        '"Ok": function () { $(this).dialog("close"); }, "Cancel": function () { $(this).dialog("close"); }' +
    '}});' + '$("#jHtdjRQt button").click(function() { console.log(1234); $( "#dialog-confirm" ).dialog("open"); });';
	}
}

widgets.tabs = {
  slots: ['tabs'],
  settings: [{'name': "onmouseover", "type": "Boolean"}],
  deps: {'jquery': [], 'jquery-ui': ['themes/smoothness/jquery-ui.min.css', 'themes/smoothness/jquery.ui.theme.css'] },
  script: function() {
    var options = {};
    if (this.settings.onmouseover) {
      options['event'] = 'mouseover';
    }
    return '$( "#' + this.id + '" ).tabs(' + JSON.stringify(options) + ');'
  },
  toHTML: function() {
    var html = '<ul>';

    _.each(this.slotAssignments.tabs, function(widget, index) {
      html += '<li><a href="#tabs-' + index + '"> Tab ' + index + '</a></li>';
    });
    html += '</ul>';

    _.each(this.slotAssignments.tabs, function(widget, index) {
      html += '<div id="tabs-' + index + '">' + widget.html() + '</div>';
    });

    return html;
  }
}

widgets.show_bootstrap_popup = {
  settingsModel: [{"name": "selector", "type": "Text"}],
  makeActionJS: function() {
    return '$( "'+this.settings.selector+'" ).modal("show");';
  }
}

widgets.hide_bootstrap_popup = {
  settingsModel: [{"name": "selector", "type": "Text"}],
  makeActionJS: function() {
    return '$( "'+this.settings.selector+'" ).modal("hide");';
  }
}

widgets.bootstrap_popup = {
  slots: ['container', 'buttons'],
  settingsModel: [{"name": "resizable", "type": "Boolean"},
    {"name": "title", "type": "Text"}],
  deps: {'jquery': [], 'bootstrap': [], 'font-awesome': ['css/font-awesome.min.css'] },
  toHTML: function() {
    return '' +
    '<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\
      <div class="modal-dialog">\
        <div class="modal-content">\
          <div class="modal-header">\
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
            <h4 class="modal-title" id="myModalLabel">'+this.settings.title+'</h4>\
          </div>\
          <div class="modal-body">' + 
            this.renderSlot('container') + 
          '</div>\
          <div class="modal-footer">' +
            this.renderSlot('buttons') + 
          '</div>\
        </div>\
      </div>\
    </div>';
  },
  script: function() {
    return '$( "#dialog-confirm" ).modal({ show: { effect: "blind", duration: 1000 }, hide: { effect: "explode", duration: 1000}, resizable: false, modal: true, autoOpen: false, minHeight:"350", height:"auto", minWidth: "500px", width: "auto", buttons: {' +
        '"Ok": function () { $(this).modal("close"); }, "Cancel": function () { $(this).modal("close"); }' +
    '}});';
  }
}