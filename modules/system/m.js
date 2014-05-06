var Handlebars = require('handlebars'),
  moment = require('moment'),
  _ = require('underscore'),
  deep = require('deep');

var cms;
module.exports = {
  widgets : {},
  functions : {},
  middleware : [{func: processPost, priority: -3}, {func: postMiddleware, priority: -2}],
  register : function(_cms) {
    cms = _cms;
  }
};
widgets = module.exports.widgets;
functions = module.exports.functions;

function postMiddleware(req, res, next) {
  if (req.method == 'POST' && req.url == '/post') {
    console.log('post');
    console.log(res.post);
    var saveResponse = function(err, data) {
      if (err) {
        console.error(500);
        console.error(err);
        res.writeHead(500, {'Content-Type': 'application/json'});
        var toSend = JSON.stringify(err, 0, 2);
        res.write(toSend);
      } else {
        console.log(200);
        console.log(data);
        res.writeHead(200, {'Content-Type': 'application/json'});
        var toSend = JSON.stringify(data, 0, 2);
        res.write(toSend);
      }
      res.end();
    }

    var widget_name = res.post['widget'];
    delete res.post['widget'];
    var widget = cms.functions.newWidget(widget_name);
    
    var user = {};
    user.clientID = req.clientID;
    user.ip = req.connection.remoteAddress;

    if (widget.load) {
      widget.load(function () {
        results = widget.save(res.post, user, req, res, saveResponse);
      });
    } else {
      results = widget.save(res.post, user, req, res, saveResponse);
    }
  } else {
    next();
  }
}

function processPost(request, response, next) {
    var queryData = "";
    if(typeof next !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            response.post = querystring.parse(queryData);
            next();
        });

    } else {
        next();
    }
}

functions.makeid = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

functions.fillSettings = function(settings, scope, exclude) {
  exclude = exclude;// || ['data'];
  _.each(settings, function(value, key) {
    if (value && (typeof value === 'string') && value.indexOf("{{") != -1 && (!_.contains(exclude, key))) {
      var template = Handlebars.compile(value);
      settings[key] = template(scope);
    }
  })
}

widgets.render_widget = {
  wrapper: 'none',
  children: function(callback) {
    var widget_input = (this.settings.input) ? JSON.parse(this.settings.input) : {};

    var values = {};
    if (input.values) {
      values = JSON.parse(this.settings.values);
    }

    var body = {};
    body['sel'] = {'type': this.settings.widget_type, 'settings': widget_input}
    callback({'body': body});
  },
  toHTML: function() {
    return this.renderSlot('body');
  }
}

widgets.widgets_view = {
  settingsModel: [{"name": "model", "type": "Record", "settings": {"model": "model"}},
    {"name": "record", "type": "Text"},
    {"name": "field", "type": "Text"}],
  children: function(callback) {
    var settings = this.settings;
    var extra_settings = deep.clone(this.settings);
    delete extra_settings['model'];
    delete extra_settings['record'];
    delete extra_settings['field'];
    cms.functions.getRecord(settings.model, settings.record, function(err, data) {
      var code = data[settings.field];
      _.each(code.widgets, function(widget) {
        widget.settings = widget.settings || {};
        _.defaults(widget.settings, extra_settings);
      });
      callback({'body': code.widgets}, code.slotAssignments);
    });
  },
  toHTML: function() {
    return this.renderSlot('body');
  }
}

widgets.header = {
  wrapper: function() {
    return this.settings.type || 'h1';
  },
  tags: ['field_view'],
  settingsModel: [{"name": "data", "type": "Text"},
      {"name": "type", "type": "Text"}],
  toHTML: function() {
    return this.settings.data;
  }
}

widgets.plaintext =  {
  wrapper: 'p',
  tags: ['field_view'],
  settingsModel: [{"name": "data", "type": "Text"}],
  toHTML: function() {
    return this.settings.data;
  }
}

widgets.filtered_html = {
  wrapper: 'p',
  tags: ['field_view'],
  settingsModel: [{"name": "data", "type": "Text"}],
  toHTML: function() {
    return this.settings.data;
  }
}

widgets.formatted_date = {
  tags: ['field_view'],
  settingsModel: [{"name": "format", "type": "Text"},
    {"name": "data", "type": "Date"}],
  toHTML: function() {
    return moment(this.settings.data).format(this.settings.format || 'MMMM Do YYYY');
  }
}

widgets.yes_no = {
  tags: ['field_view'],
  settingsModel: [{"name": "true_text", "type": "Text"},
    {"name": "false_text", "type": "Text"},
    {"name": "data", "type": "Boolean"}],
  toHTML: function() {
    return this.settings.data ? (this.settings.true_text || 'Yes') : (this.settings.false_text || 'No');
  }
}

widgets.custom_widget = {
  pseudo_names: function() {
    return Object.keys(cms.model_data['custom_widget']);
  },
  settingsModel: function(pseudo_name) {
    if (pseudo_name)
      return cms.model_data['custom_widget'][pseudo_name].Settings;
    else
      return [{"name": "pseudo_widget", "type": "Record", "settings": {"model": "custom_widget"}}];
  },
  setup: function() {
    if (this.settings.pseudo_widget)
      this.custom = deep.clone(cms.model_data['custom_widget'][this.settings.pseudo_widget]);
  },
  children: function(callback2) {
    var widgets = this.custom.Code.widgets;
    var slotAssignments = this.custom.Code.slotAssignments;
    var settings = this.settings;
    
    var callback = function() {
      callback2({'body': widgets}, slotAssignments);  
    }

    eval(this.custom.controller);
  },
  toHTML: function() {
    return this.renderSlot('body');
  }
}