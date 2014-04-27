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

widgets.recaptcha = function() {
  this.tags = ['field_edit'];
  this.settings = [{"name": "data", "type": "Captcha"}];

  this.toHTML = function(slots) {
  	var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY);
  	return recaptcha.toHTML();
  }
}