var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    fwidgets = forms.widgets,
    fs = require('fs'),
    _ = require('underscore'),
    deepExtend = require('deep-extend');

var cms;
module.exports = {
    events : {},
    actions : {},
    functions : {},
    register : function(_cms) {
	  	cms = _cms;
	  }
};
events = module.exports.events;
actions = module.exports.actions;
functions = module.exports.functions;

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
			deepExtend(deps, actionObject.deps());
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
		results = functions.ruleToJS(rule);
		script += results[0];
		//head += results[1];
		deepExtend(deps, results[1]);
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

	this.toJS = function(code) {
		return '$("' + sel + '").on( "click", function() {' + code + '});'
	}	
}

actions.refresh = function(input) {
	this.toJS = function() {
		return 'location.reload();';
	}
}

actions.alert = function(input) {
	message = input.message;

	this.toJS = function() {
		return 'alert("' + message + '");';
	}
}

actions.message = function(input) {
	message = input.message;

	this.toJS = function() {
		return 'toastr.info("' + message + '");';
	}

	this.deps = function() {
		return {'toastr': {}};
	}
}