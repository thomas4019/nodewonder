var fs = require('fs'),
    _ = require('underscore');

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.two_col = function(input) {
  this.col1 = input.col1 || 6;
  this.col2 = input.col2 || 6;

  this.form = function() {
    return  {
      "col1" : {"type": "field_text", "label" : "Col 1 Width", "value" : this.col1},
      "col2" : {"type": "field_text", "label" : "Col 2 Width", "value" : this.col2}
    };
  }

  this.deps = function() {
    return {'jquery':[],'bootstrap': []};
  }

  this.toHTML = function(zones) {
    return '<div class="row"><div class="col-sm-' + this.col1 + '">' + zones['left'] + 
      '</div><div class="col-sm-' + this.col2 + '">' + zones['right'] + '</div></div>';
  }

  this.zones = function() {
    return ['left', 'right'];
  }
}

widgets.popup = function() {
	this.zones = function() {
		return ['container'];
	}

	this.deps = function() {
		return {'jquery': [], 'jquery-ui': [], 'bootstrap': [], 'font-awesome': ['css/font-awesome.min.css'], 'jquery-ui-bootstrap': ['jquery.ui.theme.css', 'jquery.ui.theme.font-awesome.css']	}; //'themes/smoothness/jquery-ui.min.css'
	}

	this.toHTML = function(zones, id) {
		return '<div id="dialog-confirm" title="Title?">' + 
  '<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>' + 
  'Hello</p>' +
'</div>';
	}

	this.script = function() {
		return '$( "#dialog-confirm" ).dialog({ resizable: false, height:140, modal: true, buttons: {' +
        '"Ok": function () { $(this).dialog("close"); }, "Cancel": function () { $(this).dialog("close"); }' +
    '}});';
	}
}