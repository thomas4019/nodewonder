var _ = require('underscore');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  init: function() {
    cms.functions.loadModelIntoMemory('model');
    _.each(cms.model_data.model, function(list, key) {
      if (key != 'model') {
        cms.functions.loadModelIntoMemory(key);
      }
    });

    cms.model_data['model'] = cms.model_data['model'] || {};
    cms.models = cms.model_data['model'];
  },
  register : function(_cms) {
    cms = _cms;
  }
};
