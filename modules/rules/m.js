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

    },
    register : function(_cms) {
      cms = _cms;
    }
};
functions = module.exports.functions;

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
