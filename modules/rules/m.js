var fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require('handlebars');

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
  this.settings = [{"name": "sel", "label": "CSS Selector", "type": "Text"}];

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
  this.settings = [{"name":"message", "type":"Text"}];

  this.makeActionJS = function() {
    return 'alert("' + input.message + '");';
  }
}

widgets.message = function(input) {
  this.settings = [{"name":"message", "type":"Text"},
    {"name": "type", "type": "Text", "widget": "field_text_select", "settings": {label:'Message Type', choices: ['info', 'success', 'warning', 'error']} }];

  this.deps = {'jquery': [],'toastr': ['toastr.min.js', 'toastr.min.css']};

  this.makeActionJS = function() {
    return 'toastr.'+input.type+'("' + input.message + '");';
  }
}

widgets.submit_form = function(input) {
  this.settings = [{"name":"selector", "type":"Text"}];

  this.deps = {'jquery': [], 'jquery-form': []};

  this.zones = ['success', 'failure'];
 
  this.zone_tags = {success: ['action'], failure: ['action']};

  this.makeActionJS = function() {
    var slots = this.all_children;

    var success = '';
    _.each(slots['success'], function(sub) {
      success += sub.makeActionJS()+'\n';
    });
    var failure = '';
    _.each(slots['failure'], function(sub) {
      failure += sub.makeActionJS()+'\n';
    });

    return '$("form").ajaxSubmit({ success: function() {'+success+'}, error: function() {'+failure+'} }); ';
  }
}

widgets.go_back = function() {
  this.makeActionJS = function() {
    return 'window.history.back();';
  }
}

widgets.goto_page = function(settings, id, scope) {
  this.settings = [{"name": "URL", "type": "Text"}];

  this.makeActionJS = function() {
    var url = Handlebars.compile(settings.URL);
    return 'window.location="/' + url(scope) + '";';
  }
}

widgets.process = function() {
  this.save = function(values) {
    var token = values['token'];
    var related = cms.pending_processes[token];
    console.log(cms.pending_processes);
    console.log(token);
    console.log(related);
    var process = new cms.widgets[related.process](related.settings);
    console.log(process);

    process.doProcess(function() {

    });
  }
}

widgets.delete_record = function(settings) {
  this.settings = [{"name": "model", "type": "Text"},
    {"name": "record", "type": "Text"}];

  var token;

  this.makeActionJS = function() {
    var token = cms.functions.makeid(36);

    cms.pending_processes[token] = {
      process: 'delete_record',
      settings: settings,
      token: token
    };

    return 'nw.doProcess("'+token+'");';
  }

  this.doProcess = function(callback) {
    cms.functions.deleteRecord(settings.model, settings.record);
  }
}

widgets.rule = function() {
  this.zones = ['events', 'conditions', 'actions'];

  this.zone_tags = {events: ['event'], conditions: ['condition'], actions: ['action']};

  this.script = function(id, slots) {
    var actionCode = '';

    _.each(slots['actions'], function(action) {
      actionCode += action.makeActionJS()+'\n';
    });

    var code = '';

    _.each(slots['events'], function(eve) {
      code += eve.makeEventJS(actionCode)+'\n';
    });

    return code;
  }
  
  this.toHTML = function() {return '';}
}