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

functions.concatActions = function(actions) {
  var code = '';
  _.each(actions, function(action) {
    code += action.makeActionJS()+'\n';
  });
  return code;
}

functions.createHandlersCode = function(action) {
  var code = '{';
  var first = true;
  _.each(action.zone_tags, function(tags, slot_name) {
    if (_.contains(tags, 'action')) {
      console.log(slot_name);
      if (!first)
        code += ',';
      code += slot_name + ': function() {\n' + 
      cms.functions.createActionCode(action.all_children[slot_name]) +
      '}';
      first = false;
    }
  });
  code += '}';
  return code;
}

functions.createActionCode = function(actions) {
  var code = '';
  _.each(actions, function(action) {
    if (action.action) {
      code += '('+action.action+')('+JSON.stringify(action.w_settings)+', "'+action.id+'", scope,'+cms.functions.createHandlersCode(action)+');\n';  
    } else if (action.makeActionJS) {
      code += action.makeActionJS()+'\n';
    }
  });
  return code;
}

functions.eventScript = function() {
    var slots = this.all_children;
    var selector = '#'+this.parent.id;
    var code = cms.functions.createActionCode(slots.actions);
    //var code = cms.functions.concatActions(slots.actions);
    return this.makeEventJS(selector, code);
  }

widgets.onload = function (input) {
  this.zones = ['actions'];

  this.zone_tags = {actions: ['action']};

  this.script = function() {
    var slots = this.all_children;
    return cms.functions.createActionCode(slots.actions);
  }

  this.toHTML = function() {return '';}
}

widgets.on_leaving = function (input) {
  this.zones = ['actions'];

  this.zone_tags = {actions: ['action']};

  this.script = function() {
    var slots = this.all_children;
    return '$( window ).unload(function() {' + cms.functions.createActionCode(slots.actions) + '});';
  }

  this.toHTML = function() {return '';}
}

var jquery_actions = ['click', 'dblclick', 'focusout', 'hover', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup'];

_.each(jquery_actions, function(name) {

  widgets['on'+name] = function(input, id) {
    this.makeEventJS = function(sel, code) {
      return '$("' + sel + '").on( "'+name+'",\n function() {' + code + '});\n'
    }

    this.script = cms.functions.eventScript;
  }

});

widgets.refresh = function(input) {
  this.makeActionJS = function() {
    return 'location.reload();';
  }
}

widgets.execute = function(input) {
  this.settings = [{"name":"js", "type": "Javascript", "widget": "textarea"}];

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
    {"name": "type", "type": "Text", "widget": "select", "settings": {label:'Message Type', choices: ['info', 'success', 'warning', 'error']} }];

  this.deps = {'jquery': [],'toastr': []};

  this.action = function(settings, id, scope, handlers) {
    toastr[settings.type](settings.message);
  }
}

widgets.submit_form = function(settings) {
  this.settings = [{"name":"selector", "type":"Text"}];

  this.deps = {'jquery': [], 'jquery-form': []};

  this.zones = ['success', 'failure'];
  this.zone_tags = {success: ['action'], failure: ['action']};
  
  this.action = function(settings, id, scope, handlers) {
    var id = settings.selector ? settings.selector.substr(1) : '';
    var model = nw.model[id];
    console.log(model);
    console.log(nw.functions.serializedArrayToValues($('#'+id+' :input').serializeArray()));
    var data = nw.functions.expandPostValues(nw.functions.serializedArrayToValues($('#'+id+' :input').serializeArray()));
    console.log(data);

    nw.functions.cleanErrors(id);
    nw.functions.processModel(model.fields, data, function(results) {
      console.log(results); 
      if (results.validationErrors && Object.keys(results.validationErrors).length) {
        console.log('model has errors');
        nw.functions.showErrors(id, results.validationErrors);
      } else {
        console.log('model success');
        $("form").ajaxSubmit({
        success: function() {handlers.success(); },
        error: function(responseText, statusText, xhr, $form) {
          console.log(responseText); console.log(statusText); handlers.failure();}
        });
      }
    });
  }
}

widgets.go_back = function() {
  this.action = function(settings, id, scope, handlers) {
    history.go(-1);
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
  this.save = function(values, callback) {
    var token = values['token'];
    var related = cms.pending_processes[token];
    console.log(cms.pending_processes);
    console.log(token);
    console.log(related);
    var process = new cms.widgets[related.process](related.settings);
    console.log(process);

    process.doProcess(function(err, result) {
      callback(err, result);
    });
  }
}

widgets.delete_record = function(settings, id, scope) {
  this.settings = [{"name": "model", "type": "Text"},
    {"name": "record", "type": "Text"}];

  this.zones = ['success', 'failure'];
  this.zone_tags = {success: ['action'], failure: ['action']};

  var token;

  this.makeActionJS = function() {
    var token = cms.functions.makeid(36);

    var model = Handlebars.compile(settings.model);
    var record = Handlebars.compile(settings.record);
    settings.model = model(scope);
    settings.record = record(scope);

    cms.pending_processes[token] = {
      process: 'delete_record',
      settings: settings,
      token: token
    };

    var slots = this.all_children;
    var success = cms.functions.createActionCode(slots.success);
    var failure = cms.functions.createActionCode(slots.failure);

    return 'nw.functions.doProcess("'+token+'", function() { '+ success +' }, function() { '+ failure +' });';
  }

  this.doProcess = function(callback) {
    cms.functions.deleteRecord(settings.model, settings.record, function(err) {
      callback(err, {});
    });
  }
}