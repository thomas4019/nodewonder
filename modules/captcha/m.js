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
