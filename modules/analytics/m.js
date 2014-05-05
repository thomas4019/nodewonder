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

widgets.analytics_pageviews = {
  deps: {jquery: [],bootstrap: [], 'jquery.tablesorter': ['css/theme.blue.css','css/theme.bootstrap.css', 'js/jquery.tablesorter.widgets.js']},
  script: function () {
    return '$("#'+this.id+' table").tablesorter({widgets:["zebra", "stickyHeaders"]});';
  },
	toHTML: function() {
    var html = '<table class="tablesorter-blue">';
    html += '<thead> <tr> <th>URL</th> <th>Name</th> <th>Priority</th> </tr> </thead>';

    html += '<tbody>';
    for(var i = 0; i < cms.analytics_pageviews.length; i++) {
    	var view = cms.analytics_pageviews[i];
      html += '<tr> <td>' + view.url + '</td> </tr>';
    }
    html += '</tbody>';

    html += '</table>';

    return html;
	}
}

widgets.google_analytics = {
	settingsModel: [ {'name': 'code', 'type': "Text"},
		{"name": "url", "type": "Text"} ],
	action: function(settings, id, scope) {
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		  ga('create', settings.code, settings.url);
		  ga('send', 'pageview');
	},
	toHTML: function() {return ''}
}