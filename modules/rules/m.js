var fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend'),
    Handlebars = require('handlebars');

var cms;
module.exports = {
    functions : {},
    widgets : {},
    init: function() {
      _.each(cms.widgets, function(w, name) {
        if (w.action && !w.script) {
          if (w.toHTML) {
            w.script = actionScript;
          } else {
            w.makeActionJS = actionScript;
          }
        }
      });
    },
    register : function(_cms) {
      cms = _cms;
    }
};
functions = module.exports.functions;
widgets = module.exports.widgets;

function actionScript() {
  return 'nw.functions.processActionResult("'+this.id+'", new '+this.action+'(nw.functions.fillSettings('+JSON.stringify(this.settings)+', scope, []), ' +
        '"'+this.id+'", scope,'+cms.functions.createHandlersCode(this)+'));';
}

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
  _.each(action.slot_tags, function(tags, slot_name) {
    if (_.contains(tags, 'action')) {
      if (!first)
        code += ',';
      code += slot_name + ': function() {\n' +
      cms.functions.createActionCode(action.slotAssignments[slot_name]) +
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
    if (action.makeActionJS) {
      code += action.makeActionJS()+'\n';
    }
  });
  return code;
}

functions.eventScript = function() {
    var slots = this.slotAssignments;
    var selector = '#'+this.parent.id;
    var code = cms.functions.createActionCode(slots.actions);
    //var code = cms.functions.concatActions(slots.actions);
    return this.makeEventJS(selector, code);
}

functions.setupProcess = function(widget, settings) {
  var token = cms.functions.makeid(36);
  settings.token = token;

  cms.pending_processes[token] = {
    process: widget,
    settings: settings,
    token: settings.token
  };
}

widgets.onload = {
  slots: ['actions'],
  slot_tags: {actions: ['action']},
  script: function() {
    return cms.functions.createActionCode(this.slotAssignments.actions);
  },
  toHTML: function() {return '';}
}

widgets.on_leaving = {
  slots: ['actions'],
  slot_tags: {actions: ['action']},
  script: function() {
    return '$( window ).unload(function() {' + cms.functions.createActionCode(this.slotAssignments.actions) + '});';
  },
  toHTML: function() {return '';}
}

var jquery_actions = ['click', 'dblclick', 'focusout', 'hover', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup'];

_.each(jquery_actions, function(name) {

  widgets['on'+name] = {
    makeEventJS: function(sel, code) {
      return '$("' + sel + '").on( "'+name+'",\n function() {' + code + '});\n'
    },
    script: functions.eventScript
  }

});

widgets.refresh = {
  makeActionJS: function() {
    return 'location.reload();';
  }
}

widgets.execute = {
  settingsModel: [{"name":"js", "type": "Javascript", "widget": "textarea"}],
  makeActionJS: function() {
    return this.settings.js;
  }
}

widgets.alert = {
  settingsModel: [{"name":"message", "type":"Text"}],
  makeActionJS: function() {
    return 'alert("' + this.settings.message + '");';
  }
}

widgets.message = {
  settingsModel: [{"name":"message", "type":"Text"},
    {"name": "type", "type": "Text", "widget": "select", "settings": {
      label:'Message Type', choices: ['info', 'success', 'warning', 'error']
    } }],
  deps: {'jquery': [],'toastr': [], 'handlebars': []},
  action: function(settings, id, scope, handlers) {
    toastr[settings.type](settings.message);
  }
}

widgets.submit_form = {
  settingsModel: [{"name":"selector", "type":"Text"}],
  deps: {'jquery': [], 'jquery-form': []},
  slots: ['success', 'failure'],
  slot_tags: {success: ['action'], failure: ['action']},
  action: function(settings, id, scope, handlers) {
    var id = settings.selector ? settings.selector.substr(1) : '';
    var model = nw.model[id];
    var data = nw.functions.expandPostValues(nw.functions.serializedArrayToValues($('#'+id+' :input').serializeArray()));

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

widgets.go_back = {
  action: function(settings, id, scope, handlers) {
    history.go(-1);
  }
}

widgets.goto_page = {
  settingsModel: [{"name": "URL", "type": "Text"}],
  deps: {'handlebars': []},
  action: function(settings, id, scope, handlers) {
    window.location='/' + settings.URL;
  }
}

widgets.process = {
  save: function(values, user, req, res, callback) {
    var token = values['token'];
    var input = JSON.parse(values[  'input']);
    var related = cms.pending_processes[token];
    if (related) {
      if (cms.widgets[related.process]) {
        var process = cms.functions.newWidget(related.process,related.settings);
        process.user = user;
        process.req = req;
        process.res = res;

        process.doProcess(input, function(err, result) {
          callback(err, result);
        });
      } else {
        callback('missing widget: ' + related.process);
      }
    } else {
      callback('process token not found');
    }
  }
}

widgets.if = {
  settingsModel: [{"name": "condition", "type": "Text"}],
  slots: ['then', 'else'],
  slot_tags: {"then": ['action'], "else": ['action']},
  action: function(settings, id, scope, handlers) {
    if (eval(settings.condition)) {
      handlers.then();
    } else {
      handlers.else();
    }
  }
}
