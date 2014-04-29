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

widgets.recaptcha = function(settings, id) {
  this.tags = ['field_edit'];
  this.settings = [{"name": "data", "type": "Captcha"}];

  this.toHTML = function(slots) {
  	var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY);
  	return '<label class="control-label">Captcha:</label>'+
    recaptcha.toHTML();
  }

  this.processData = function(data, oldData, user) {

  }

  this.validateData = function(data, callback) {
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
  }

  this.script = function() {
    return 'setTimeout(function() {'+
    '$("input[name=\'recaptcha_response_field\']").attr("name", "'+id+'-recaptcha_response_field");' +
    '$("input[name=\'recaptcha_challenge_field\']").attr("name", "'+id+'-recaptcha_challenge_field");' +
    '}, 500);';
  }
}

widgets.captchagen = function(settings, id) {
  this.tags = ['field_edit'];
  this.settings = [{"name": "data", "type": "Captcha"}];

  this.toHTML = function(slots) {
    
  }

  this.validateData = function(data) {

  }

  this.script = function() {
    return '';
  }
}