var cms;
module.exports = {
    functions : {},
    widgets : {},
    middleware: [{func: analyticsMiddleware, priority: -10}],
    init: function() {
    },
    register : function(_cms) {
      cms = _cms;
    }
};
functions = module.exports.functions;
widgets = module.exports.widgets;

function analyticsMiddleware(req, res, next) {
  cms.functions.saveRecord('pageview', cms.functions.generateRecordID(), {url: req.url, datetime: Date.now(), ip: req.connection.remoteAddress});
  next();
}
