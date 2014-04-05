var cms;
module.exports = {
  widgets : {},
  functions : {},
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

functions.makeid = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

widgets.header = function(input, id) {
  this.wrapper = input.type || 'h1';

  this.toHTML = function(slots) {
    return input.text;
  }
}

widgets.text =  function(input, id) {
  this.wrapper = 'p';

  this.toHTML = function(slots) {
    return input.text;
  }
}