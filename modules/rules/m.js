var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    fwidgets = forms.widgets,
    fs = require('fs'),
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

events.clicked = function(input) {
  sel = input.sel;

  this.input = function() {
    return  {
      "sel:field_text" : {"label" : "CSS Selector", "value" : input.sel},
    };
  }

  this.toJS = function(code) {
    return '$("' + sel + '").on( "click", function() {' + code + '});'
  } 
}

actions.refresh = function(input) {
  this.toJS = function() {
    return 'location.reload();';
  }
}

actions.execute = function(input) {
  this.toJS = function() {
    return input.js;
  }
}

actions.alert = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'alert("' + message + '");';
  }
}

actions.message = function(input) {
  message = input.message;

  this.input = function() {
    return  {
      "message:field_text" : {"label" : "Message", "value" : input.message},
    };
  }

  this.toJS = function() {
    return 'toastr.info("' + message + '");';
  }

  this.deps = function() {
    return {'toastr': []};
  }
}


widgets.rule_page_editor = function(input) {
  var page = input.page;

  this.children = function(callback) {
    fs.readFile('pages/' + page + '.json', 'utf8', function(err, data) {
      if (err) {
        console.trace("Here I am!")
        return console.log(err);
      }
      var jdata = JSON.parse(data);
      var state = jdata[0];
      var rules = jdata[1];
      var state2 = {};

      _.each(rules, function(rule, index) {
        state2['r' + index + ':' + 'rule_settings'] = rule;
      });

      callback({'body' : state2 });
    }); 
  }

  this.deps = function() {
    return {'jquery-ui': []};
  }

  this.toHTML = function(zones) {
    return zones['body'];
  }
}

widgets.rule_settings = function(input, id) {
  var rule = input;

  this.children = function(callback) {
    var c = {};

    c['e:rule_event_settings'] = rule.event;
    _.each(rule.actions, function(action, index) {
      c['a' + index + ':rule_action_settings'] = action;
    });

    callback({'body' : c});
  }

  this.toHTML = function(zones) {
    return '<div class="well">' + (zones['body'] || '') + '</div>';
  }
}

widgets.rule_event_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var eventInstance = new cms.events[type](input[type]);
    callback(eventInstance.input ? {'body' : eventInstance.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}


widgets.rule_action_settings = function(input, id) {
  var type = Object.keys(input)[0];

  this.children = function(callback) {
    var action = new cms.actions[type](input[type]);
    callback(action.input ? {'body' : action.input()} : {});
  }

  this.toHTML = function(zones) {
    return '<h4>' + type + (zones['body'] || '') + '</h4>';
  }
}