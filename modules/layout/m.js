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
	this.toHTML = function(zones, id) {
		return '<div id="dialog-confirm" title="Empty the recycle bin?">' + 
  '<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>These items will be permanently deleted and cannot be recovered. Are you sure?</p>' +
'</div>';
	}

	this.script = function() {
		'$( "#dialog-confirm" ).dialog({ resizable: false, height:140, modal: true });'
	}
}