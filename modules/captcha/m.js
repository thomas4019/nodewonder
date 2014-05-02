Recaptcha = require('recaptcha').Recaptcha;

var PUBLIC_KEY  = '6LeAi7wSAAAAADr8jp2ETyQGJFB61auuzQBm2PNh',
    PRIVATE_KEY = '6LeAi7wSAAAAAHXevSzPGSiqulNknvGZhimaWDVk';

var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
functions = module.exports.functions;
widgets = module.exports.widgets;

widgets.recaptcha = {
  tags: ['field_edit'],
  settingsModel: [{"name": "data", "type": "Captcha"}],
  toHTML: function() {
  	var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY);
  	return '<label class="control-label">Captcha:</label>' + recaptcha.toHTML();
  },
  validateData: function(data, callback) {
    var raw_data = {
        remoteip:  '24.49.170.112',
        challenge: data.recaptcha_challenge_field,
        response:  data.recaptcha_response_field
    };
    var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, raw_data);

    recaptcha.verify(function(success, error_code) {
      if (success) {
        callback(false);
      }
      else {
        callback('invalid');
      }
    });
  },
  script: function() {
    return 'setTimeout(function() {'+
    '$("input[name=\'recaptcha_response_field\']").attr("name", "'+this.id+'-recaptcha_response_field");' +
    '$("input[name=\'recaptcha_challenge_field\']").attr("name", "'+this.id+'-recaptcha_challenge_field");' +
    '}, 500);';
  }
}

widgets.captchagen = {
  tags: ['field_edit'],
  settingsModel: [{"name": "data", "type": "Captcha"}],
  toHTML: function() {
    return ''  
  },
  validateData: function(data) {

  },
  script: function() {
    return '';
  }
}