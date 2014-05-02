var _ = require('underscore'),
    bowerJson = require('bower-json'),
    path = require('path'),
    async = require('async');

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

widgets.calendar = {
  deps: {'jquery': [], 'jquery-ui': [], 'fullcalendar': ['fullcalendar.min.js','fullcalendar.css']},
  script: function() {
    return "$('#fcalendar').fullCalendar({ header: { left: 'prev,next today', center: 'title', " + 
      "right: 'month,agendaWeek,agendaDay' }, editable: true});";
  },
  toHTML: function() {
    return '<div id="fcalendar"></div>';
  }
}