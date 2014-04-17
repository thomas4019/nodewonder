var fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend');

var cms;
module.exports = {
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
functions = module.exports.functions;
widgets = module.exports.widgets;

widgets.load = function (input) {
  this.makeEventJS = function(code) {
    return code
  }
}

widgets.clicked = function(input) {
  this.form = function() {
    return  {
      "sel" : {"type":"field_text", "name":"sel", "label" : "CSS Selector", "value" : (input ? input.sel : '') },
    };
  }

  this.makeEventJS = function(code) {
    return '$("' + input.sel + '").on( "click", function() {' + code + '});'
  } 
}

widgets.refresh = function(input) {
  this.makeActionJS = function() {
    return 'location.reload();';
  }
}

widgets.execute = function(input) {
  this.form = function() {
    return  {
      "js" : {"type":"field_text", "name":"sel", "label" : "Javascript Code", "value" : (input ? input.js : '') },
    };
  }

  this.makeActionJS = function() {
    return input.js;
  }
}

widgets.alert = function(input) {
  this.form = function() {
    return  {
      "message" : {"type" : "field_text" ,"label" : "Message", "value" : input.message},
    };
  }

  this.makeActionJS = function() {
    return 'alert("' + input.message + '");';
  }
}

widgets.message = function(input) {
  this.form = function() {
    return  {
      "message" : {"name": "message","type": "field_text","label" : "Message", "value" : (input ? input.message : '') },
    };
  }

  this.deps = {'jquery': [],'toastr': []};

  this.type = 'action';

  this.makeActionJS = function() {
    return 'toastr.info("' + input.message + '");';
  }
}

widgets.rule = function() {
  this.zones = ['events', 'conditions', 'actions'];

  this.zone_tags = {events: ['event'], conditions: ['condition'], actions: ['action']};

  this.script = function(id, slots) {
    var actionCode = '';

    _.each(slots['actions'], function(action) {
      actionCode += action.makeActionJS();
    });

    var code = '';

    _.each(slots['events'], function(eve) {
      code += eve.makeEventJS(actionCode);
    });

    return code;
  }
  
  this.toHTML = function() {return '';}
}