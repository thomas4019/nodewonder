var fs = require('fs'),
    _ = require('underscore'),
    deep = require('deep'),
    moment = require('moment');

module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

var bootstrap_settings = {
  errorAfterField: true,
  cssClasses: {
      label: ['control-label']
  }
};

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

widgets.checkbox = {
  tags: ['field_edit'],
  settingsModel: [{"name": "label", "type": "Text"},
      {"name": "name", "type": "Text"},
      {"name": "data", "type": "Boolean"} ],
  processData: function(value) {
    return value == "on";
  },
  toHTML: function(label) {
    return '<input type="checkbox" name="' + this.id + '" ' + (this.settings.data ? 'checked="checked"': '' ) + ' >' +  label;
  }
}

widgets.textbox = {
  settingsModel: [{"name": "inline", "type": "Boolean"},
      {"name": "data", "type": "Text"}],
  head: ['/modules/forms/forms.css'],
  deps: {'jquery': [],'bootstrap':[]},
  tags: ['field_edit'],
  toHTML: function(label) {
    var element = '<input class="form-control input-small" type="text" name="' + this.id + '"' + (this.settings.data ? ' value="' + htmlEscape(this.settings.data) + '"' : '')+' />';

    if (this.settings.inline) {
      return '<div class="controls form-inline">' + (this.settings.label ? label : '') + element + '</div>';
    } else {
      return (this.settings.label ? label : '') + element;
    }
  }
};

widgets.password = {
  tags: ['field_edit'],
  deps: {'jquery': [],'bootstrap':[]},
  settingsModel: [ {"name": "inline", "type": "Boolean"},
      {"name": "data", "type": "Text"} ],
  toHTML: function(label) {
    var element = '<input class="form-control input-small" type="password" name="' + this.id + '"' + (this.settings.data ? ' value="' + htmlEscape(this.settings.data) + '"' : '')+' />';

    if (this.settings.inline) {
      return '<div class="controls form-inline">' + (this.settings.label ? label : '') + element + '</div>';
    } else {
      return (this.settings.label ? label : '') + element;
    }
  }
}


widgets.email_textbox = {
  tags: ['field_edit'],
  deps: {'jquery': [],'bootstrap':[]},
  settingsModel: [ {"name": "inline", "type": "Boolean"},
      {"name": "data", "type": "Email"} ],
  toHTML: function(label) {
    var element = '<input class="form-control input-small" type="email" name="' + this.id + '"' + (this.settings.data ? ' value="' + htmlEscape(this.settings.data) + '"' : '')+' />';

    if (this.settings.inline) {
      return '<div class="controls form-inline">' + (this.settings.label ? label : '') + element + '</div>';
    } else {
      return (this.settings.label ? label : '') + element;
    }
  }
}

widgets.numeric_textbox = {
  tags: ['field_edit'],
  deps: {'jquery': [],'bootstrap':[]},
  settingsModel: [ {"name": "inline", "type": "Boolean"},
      {"name": "data", "type": "Number"},
      {"name": "min", "type": "Number", "settings" : {"min": 2}},
      {"name": "max", "type": "Number"} ],
  processData: function(data) {
    return parseInt(data);
  },
  validateData: function(data) {
    if (this.settings.max && data > this.settings.max)
      return 'Number is too large';
    if (this.settings.min && data < this.settings.min)
      return 'Number is too small';
  },
  toHTML: function(label) {
    var label = '<label class="control-label" for="' + this.id + '-textbox" style="padding-right: 5px;">' + (this.settings.label ? this.settings.label : '') + ':' + '</label>';    
    var element = '<input id="'+this.id+'-textbox" class="form-control input-small" type="number" name="' + this.id + '"'+ (this.settings.data ? ' value="' + htmlEscape(this.settings.data) + '"' : '') + ' />';

    if (this.settings.inline) {
      return '<div class="controls form-inline">' + label + element + '</div>';
    } else {
      return label + element;
    }
  }
}

widgets.range = {
  tags: ['field_edit'],
  settingsModel: [ {"name": "data", "type": "Number"},
      {"name": "min", "type": "Number"},
      {"name": "max", "type": "Number"} ],
  toHTML: function(label) {
    var element = this.settings.min+'<input type="range" style="width: 300px; display: inline;" name="'+this.id+'" value="'+this.settings.data+'" min="'+this.settings.min+'" max="'+this.settings.max+'">'+this.settings.max;
    return label + element;
  }
}

widgets.slider = {
  tags: ['field_edit'],
  deps: {'jquery': [],'jquery-ui':['themes/smoothness/jquery-ui.css']},
  settingsModel: [ {"name": "data", "type": "Number"},
      {"name": "min", "type": "Number"},
      {"name": "max", "type": "Number"} ],
  script: function() {
    var options = {range: 'max', min: this.settings.min || 1, max: this.settings.max || 10};
    if (this.settings.data)
      options.value = this.settings.data;
    options.slide = "REPLACE";
    var code = 'function( event, ui ) { $( "#'+this.id+' input" ).val( $( "#'+this.id+' .slider" ).slider( "value" ) );  }';
    options = JSON.stringify(options);
    options = options.replace('"REPLACE"',code);
    return '$( "#'+this.id+' .slider" ).slider(' + options + '); ';
  },
  toHTML: function() {
    var label = '<label for="' + this.id + '" style="padding-right: 5px;">' + (this.settings.label ? this.settings.label : '') + ':' + '</label><input name="'+this.id+'" type="textbox" style="border:0; color:#f6931f; font-weight:bold;" ' + (this.settings.data ? 'value="'+this.settings.data : '') +'" />';
    var element = '<div class="slider" />';
    return label + element;
  }
}

widgets.textarea = {
  tags: ['field_edit'],
  settingsModel: [ {"name": "label", "type": "Text"},
      {"name": "name", "type": "Text"},
      {"name": "data", "type": "Text"} ],
  toHTML: function(label) {
    var element = '<textarea class="form-control input-small"  name="' + this.id + '" >'+ (this.settings.data || '')+'</textarea>';
    return label + element;
  }
}

widgets.ckeditor = {
  tags: ['field_edit'],
  deps: {'jquery': [], 'ckeditor': ['ckeditor.js']},
  settingsModel: [ {"name": "label", "type": "Text"},
      {"name": "toolbar", "type": "Text", "widget": "select", "settings": {label:'Button Type', choices: ['Basic', 'Advanced']} },
      {"name": "data", "type": "Text"} ],
  script: function() {
    return 'CKEDITOR.replace("' + this.id + '-Editor",{toolbar:"Basic"});';
  },
  toHTML: function(label) {
    return label + '<textarea id="'+this.id+'-Editor" name="' + this.id + '">' + (this.settings.data || '') + '</textarea>';
  }
}

widgets.iframe = {
  settingsModel: [ {"name": "url", 'type': 'Text'} ],
  toHTML: function() {
    return '<iframe src="' + this.settings.url  + '" style="width: 100%; height: 800px;" ></iframe>';
  }
}

widgets.select = {
  tags: ['field_edit'],
  settingsModel: [{"name": "data", "type": "Text"}],
  toHTML: function(label) {
    var choices = this.settings.choices;
    if (Array.isArray(choices)) {
      choices = _.object(choices, choices);
    }

    var element = '<select name="' + id + '">';

    _.each(choices, function(choice) {
      element += '<option value="' + choice + '" ' + (choice == this.settings.data ? 'selected="selected"' : '') + ' >' + choice + '</option>';
    });

    element += '</select>';

    return label + element;
  }
}

widgets.button = {
  wrapper: 'span',
  settingsModel: [ {"name": "label", "type": "Text"},
      {"name": "button_type", "type": "Text", "widget": "select", "settings": {
        label:'Button Type', choices: ['default', 'primary', 'success', 'info', 'warning', 'danger']
      } }],
  deps: {'jquery': [], 'bootstrap': []},
  toHTML: function() {
    return '<input type="button" class="btn btn-' + this.settings.button_type + '" value="' + this.settings.label + '" >';
  },
}

widgets.submit = {
  settingsModel: [ {"name": "label", "type": "Text"},
      {"name": "button_type", "type": "Text", "widget": "select", "settings": {label:'Button Type', choices: ['default', 'primary', 'success', 'info', 'warning', 'danger']} } ],
  deps: {'jquery': []},
  toHTML: function() {
    return '<input type="submit" class="btn btn-' + this.settings.button_type + '" value="' + this.settings.label + '" />'
  }
}

widgets.date = {
  deps: {'jquery': {}, 'jquery-ui': ['themes/smoothness/jquery-ui.min.css'] },
  tags: ['field_edit'],
  settingsModel: [{"name": "data", "type": "Date"}],
  script: function() {
    return '$("#' + this.id + ' input").datepicker();';
  },
  toHTML: function(label) {
    var value = this.settings.data ? moment(this.settings.data).format('MM/DD/YYYY') : '';

    if (!value || _.isEmpty(value))
      value = '';

    var element = '<input id="'+this.id+'-textbox" class="form-control input-small" type="text" name="' + this.id + '"'+ (this.settings.data ? ' value="' + htmlEscape(this.settings.data) + '"' : '') + ' />';
    
    if (this.settings.inline) {
      return '<div class="controls form-inline">' + label + element + '</div>';
    } else {
      return label + element;
    }
  },
  processData: function(data) {
    return new Date(data).getTime();
  }
}

widgets.field_multi = {
  setup: function() {
    this.isSetup = true;
    this.w_input = deep.clone(this.settings);

    this.can_add = false;
    this.map = false;

    if (this.settings.quantity && this.settings.quantity.indexOf(':') !== -1) {
      this.settings.quantity = this.settings.quantity.substr(this.settings.quantity.indexOf(':') + 1, this.settings.quantity.length)
      this.w_type = 'key_value';
      this.map = true;
      var ndata = [];
      _.each(this.settings.data, function(value, key) {
        ndata.push({key: key, value: value});
      });
      this.settings.data = ndata;
      console.log(this.settings.data);
    } else {
      this.w_type = this.settings.widget;
      delete this.w_input['widget'];
    }

    if (this.settings.quantity && this.settings.quantity.slice(-1) == '+') {
      this.can_add = true;
      this.settings.quantity = this.settings.quantity.substring(0, this.settings.quantity.length - 1)
    }

    delete this.w_input['label'];
    this.w_input['inline'] = 'multi';
  },
  children: function(callback) {
    if (!this.isSetup)
      this.setup();

    var state = {"body": {}};

    if (this.can_add) {
      state["body"]["add"] = {"type": "button", "slots": {"events": ["onclick"]}}
      state["body"]["add"]["settings"] = {"button_type": "primary", "label": "Add more items"}
    }

    this.count = (this.settings.data && Array.isArray(this.settings.data)) ? this.settings.data.length : this.settings.quantity;

    if (this.count == 0) {
      this.count = this.settings.quantity;
    }
    if (this.count == '') {
      this.count = 3;
    }

    for (var i = 0; i < this.count; i ++) {
      state["body"]["" + (i)] = {};
      state["body"]["" + (i)]['type'] = this.w_type;
      state["body"]["" + (i)]['settings'] = deep.clone(this.w_input);
      if (this.settings.data && this.settings.data[i])
        state["body"]["" + i]['settings']['data'] = this.settings.data[i];
    }

    state["body"]["onclick"] = {
      "type": "onclick",
      "slots": {"actions": ["add_action"]}
    }
    state["body"]["add_action"] = {
      "type": "execute",
      "settings": {"js": "nw.functions.insertWidgetBefore('" + this.w_type + "','" + this.id + "-'+(nw.counter['"+this.id+"']++), '"+ JSON.stringify(this.w_input) + "', '#" + this.id + "-add')"},
    }
    callback(state);
  },
  wrapper_style: "padding-left: 5px;",
  script: function() {
    return 'nw.counter["'+this.id+'"] = ' + (this.count) + ';';
  },
  toHTML: function(label) {
    var arr = '<input type="hidden" name="'+this.id+'" value="' + (this.map ? 'new Object' : 'new Array') + '" />';
    return label + arr + this.renderSlot('body');
  },
  processData: function(value) {
    if (!this.isSetup)
      this.setup();

    if (this.map) {
      var out = {};
      var widget = cms.functions.newWidget(this.w_type, this.settings);

      _.each(value, function(ivalue) {
        var processed = widget.processData(ivalue);
        if (processed.key) {
          out[processed.key] = processed.value;
          delete processed['key'];
        }
      });

      return out;
    } else {
      var out = [];
      var widget = cms.functions.newWidget(this.w_type, this.settings);

      _.each(value, function(ivalue) {
        out.push(widget.processData(ivalue));
      });

      return out;
    }
  }
}

widgets.key_value = {
  setup: function() {
    this.w_type = this.settings.widget;
    this.w_input = this.settings;

    delete this.w_input['widget'];
    delete this.w_input['label'];
  },
  children: function(callback) {
    if (!this.isSetup)
      this.setup();

    var state = {"body": {}};

    state["body"]["key"] = {
      type: 'textbox',
      settings: {data: (this.settings.data ? this.settings.data.key : undefined) }
    };

    state["body"]["value"] = {
      type: this.w_type,
      settings: deep.clone(this.w_input),
    };
    state["body"]["value"]["settings"]["data"] = this.settings.data ? this.settings.data.value : undefined;

    callback(state);
  },
  wrapper_style: "padding-left: 5px;",
  toHTML: function(slots) {
    return this.renderSlot('body');
  },
  processData: function(value) {
    if (!this.isSetup)
      this.setup();

    var key = value.key;
    var widget = cms.functions.newWidget(this.w_type, this.settings);

    var out = widget.processData(value);
    out['key'] = key;

    return out;
  }
}

widgets.rating = {
  tags: ['field_edit'],
  settingsModel: [{"name": "data", "type": "vote"}],
  processData: function(data) {
    return parseFloat(data);
  },
  toHTML: function() {
    var label = '<label class="control-label" for="' + this.id + '-textbox" style="padding-right: 5px;">' + this.settings.label + ':' + '</label>';    
    var element = '<input id="'+this.id+'-textbox" class="form-control input-small" type="number" name="' + this.id + '" ' + (this.settings.data ? 'value="' + htmlEscape(this.settings.data) + '"' : '') + '/>';

    return (this.settings.label ? label : '') + element;
  }
}

widgets.fivestar = {
  tags: ['field_edit'],
  settingsModel: [{"name": "data", "type": "vote"},
    {"name": "star_count", "type": "Number"}],
  deps: {'raty': ['lib/jquery.raty.js']},
  processData: function(data, old, user) {
    old = old || {};
    old.ratings = old.ratings || {};
    old.total = old.total || 0;
    old.count = old.count || 0;

    var amount = parseFloat(data);
    if (old.ratings[user.clientID]) { //changing rating
      var diff = amount - old.ratings[user.clientID];
      old.total += diff;
    } else {
      old.total += amount;
      old.count++;
    }

    old.average = old.total / old.count;
    old.ratings[user.clientID] = amount;
    return old;
  },
  toHTML: function() {
    this.settings.data = this.settings.data || {average: 0, count: 0};
    return '<label class="control-label">'+this.settings.label+':</label><div id="'+this.id+'-stars"></div>' +
    '<input id="'+this.id+'-score" class="form-control input-small" type="hidden" name="' + this.id + '" ' + (this.settings.data ? 'value="' + this.settings.data.average + '"' : '') + ' />' +
    'Average: ' + Math.round(this.settings.data.average*100)/100 + ' (' + this.settings.data.count + ' vote)';
  },
  script: function() {
    return '$("#'+this.id+'-stars").raty({ click: function(score) { $("#'+this.id+'-score").val(score); }, ' +
     (this.settings.data ? ' score: '+this.settings.data.average +',' : '') + 
     (this.settings.star_count ? ' number: '+this.settings.star_count +',' : '') + 
     ' path: "/bower_components/raty/lib/img", half: true });';
  }
}

widgets.up_down = {
  tags: ['field_edit'],
  settingsModel: [{"name": "data", "type": "vote"}],
  deps: {'font-awesome': ['css/font-awesome.css']},
  head: ['/modules/forms/up_down.css'],
  processData: function(data, old, user) {
    old = old || {};
    old.ratings = old.ratings || {};
    old.total = old.total || 0;
    old.count = old.count || 0;

    var amount = parseFloat(data);
    if (old.ratings[user.clientID]) { //changing rating
      var diff = amount - old.ratings[user.clientID];
      old.total += diff;
    } else {
      old.total += amount;
      old.count++;
    }

    old.average = old.total / old.count;
    old.ratings[user.clientID] = amount;
    return old;
  },
  script: function() {
    return '$("#'+this.id+' .up-vote").on("click", function() { \
      $("#'+this.id+' .up-vote").addClass("selected"); $("#'+this.id+' .down-vote").removeClass("selected"); $("#'+this.id+' input").val(1); \
    });' +
    '$("#'+this.id+' .down-vote").on("click", function() { \
      $("#'+this.id+' .down-vote").addClass("selected"); $("#'+this.id+' .up-vote").removeClass("selected"); $("#'+this.id+' input").val(-1); \
    });';
  },
  toHTML: function() {
    var label = '<label class="control-label">'+this.settings.label+':</label>';
    return '<i class="up-vote fa fa-caret-up fa-3x"></i>' +
    '<div style="width: 30px; text-align: center;">'+(this.settings.data ? this.settings.data.total : '')+'</div>' +
    '<i class="down-vote fa fa-caret-down fa-3x"></i>' + 
    '<input type="hidden" name="'+this.id+'" >';
  }
}

widgets.upload = {
  tags: ['field_edit'],
  settingsModel: [{"name": "data", "type": "File"}],
  toHTML: function() {
    return '<input type="file" name="'+this.id+'" />'
  }
}