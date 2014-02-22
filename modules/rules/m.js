var fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend'),
    dextend = require('dextend');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    widgets : {},
    register : function(_cms) {
      cms = _cms;
    }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;
widgets = module.exports.widgets;

functions.ruleToJS = function(rule) {
  var eventName = Object.keys(rule.event)[0];
  var eventInput = rule.event[eventName];
  var event = new cms.events[eventName](eventInput);
  var script = '';
  var head = '';
  var deps = [];
  _.each(rule.actions, function(action, index) {
    var name = Object.keys(action)[0];
    var input = action[name];
    var actionObject = new cms.actions[name](input);
    script += actionObject.toJS();
    head += actionObject.head ? actionObject.head() : '';
    if (actionObject.deps) {
      dextend(deps, actionObject.deps());
    }
  });

  head += event.head ? event.head() : '';

  return [event.toJS(script), deps];
}

functions.processRules = function(rules, callback) {
  var script = '';
  var head = '';
  var deps = {};
  _.each(rules, function(rule, index) {
    results = cms.functions.ruleToJS(rule);
    script += results[0];
    //head += results[1];
    dextend(deps, results[1]);
  });
  callback(script, deps);
}


events.load = function (input) {
  this.toJS = function(code) {
    return code
  }
}

widgets.clicked = function(input) {
  this.form = function() {
    return  {
      "sel" : {"type":"field_text", "name":"sel", "label" : "CSS Selector", "value" : (input ? input.sel : '') },
    };
  }

  this.toJS = function(code) {
    return '$("' + input.sel + '").on( "click", function() {' + code + '});'
  } 
}

widgets.refresh = function(input) {
  this.toJS = function() {
    return 'location.reload();';
  }
}

widgets.execute = function(input) {
  this.form = function() {
    return  {
      "js" : {"type":"field_text", "name":"sel", "label" : "Javascript Code", "value" : (input ? input.js : '') },
    };
  }

  this.toJS = function() {
    return input.js;
  }
}

widgets.alert = function(input) {
  this.form = function() {
    return  {
      "message" : {"type" : "field_text" ,"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
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

  this.toJS = function() {
    return 'toastr.info("' + input.message + '");';
  }
}

widgets.rule = function() {
  this.zones = ['events', 'conditions', 'actions'];

  this.script = function(id, slots) {
    var actionCode = '';

    _.each(slots['actions'], function(action) {
      actionCode += action.toJS();
    });

    var code = '';

    _.each(slots['events'], function(eve) {
      code += eve.toJS(actionCode);
    });

    return code;
  }
}