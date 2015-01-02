/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path], domain)
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

//Provide basic jQuery style functionality
$ = function(fn) {
	document.addEventListener('DOMContentLoaded', fn);
}

var docCookies = {
  getItem: function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};

var nw = function() {


	function makeid(length) {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < length; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	}

	function serializedArrayToValues(values) {
		var settings_post = {};
		values.map(function(value) {
			if (settings_post[value.name]) {
				if (typeof settings_post[value.name] == 'string') {
					settings_post[value.name] = [ settings_post[value.name] ];
				}
				settings_post[value.name].push(value.value);
			} else {
				settings_post[value.name] = value.value;
			}
		});
		return settings_post;
	}

	function expandPostValues(values) {
		var data = {};
		var tocheck = [];

		for (var key in values) {
			value = values[key];
			var parts = key.split('-');
			if (parts.length >= 2) {
				var current = data;
				for (var i = 1; i < parts.length - 1; i++) {
					var v = parts[i];
					current = current[v] = current[v] || {};
				}
				var last = parts[parts.length - 1];
				if (value == 'new Array') {
					value = [];
					tocheck.push(last);
				}
				if (value == 'new Object') {
					value = {};
					//tocheck.push(last);
				}
				current[last] = value;
			}
		}

		function hasValues(value) {
			if (typeof value == 'object') {
				for (var key in value)
					if (hasValues(value[key]))
						return true;

				return false;
			}

			return value;
		}

		for (var key in tocheck) {
			index = tocheck[key];
			data[key] = _.filter(data[key], function(value) {
				return hasValues(value);
			});
		}

		return data;
	}

	//data['start-input'] = '{id:wjarzQWtBwM}';//'%7B"id"%3A"wjarzQWtBwM"%7D';

	function loadWidgetForm(page, id, callback) {
		var data = {};
		data['start-widget_id'] = id;
		data['start-widget_page'] = page;
		$.getJSON('/internal/page_widget', data, function(result) {
			callback(result);
		});
	}

	function renderWidget(type, id, input, callback) {
		var data = {};
		data['widget_id'] = id;
		data['widget_type'] = type;
		data['input'] = input;
		$.getJSON('/internal/render_widget?raw', data, function(result) {
			callback(result);
		});
	}

	function insertWidgetBefore(type, id, input, selector) {
		renderWidget(type, id, input, function(result) {
			$(selector).before(result.html);

			//This scrolltop hack is here because some widgets use angular whose bootstrap method
			//causes it to scroll to tho top for some reason.
			var tempScrollTop = $(window).scrollTop();
			eval('var scope = {}; ' + result.javascript);
			if (result.style) {
				var node = document.createElement('style');
    		node.innerHTML = result.style;
    		console.log(node);
    		document.body.appendChild(node);
    	}

			$(window).scrollTop(tempScrollTop);
		});
	}

	function getWidgetSettingsModel(widget_type, callback) {
		var data = {widget_type: widget_type}
		$.getJSON('/internal/widget_settings_model', data, function(result) {
		  if (result.error) {
		  	callback(result.error);
		  } else {
		  	callback(undefined, result);
		  }
		});
	}

	function configureWidget(id, settings_model, settings, callback) {
		//var widget_id = id.replace('-input', '-widget')
		//var widget_type = $('#' + widget_id + ' select').val();

		$("#widgetForm").remove();
		x = $('#'+id+' .configure').offset().left;
		y = $('#'+id+' .configure').offset().top;

		var ne = $( '<div id="widgetForm" style="left:'+x+'px; top:'+y+'px;" />' );
		console.log('launching widget configuration popup');
		$('body').append(ne);

		var data = {};
		data['fields'] = JSON.stringify(settings_model);
		data['values'] = JSON.stringify(settings);

		$.getJSON('/internal/render_model?raw', data, function(result) {
			console.log(result);
	    if (result.error) {
	    	$("#widgetForm").remove();
	    } else {
	    	var form_begin = $("#widgetForm").html('<div>' + id + '</div>' + result.html + '<input type="button" class="save" value="Save">' + '<div class="close">X</div>');

				_.each(result.head, function(dep) {
					if (_.indexOf(nw.head, dep) == -1) {
						console.log('Adding: '+dep+' to page');
						$('head').append(dep);
						nw.head.push(dep);
					}
				});
				setTimeout('var scope = {}; ' + result.javascript, 25);

				if (result.style) {
					var node = document.createElement('style');
	    		node.innerHTML = result.style;
	    		console.log(node);
	    		document.body.appendChild(node);
	    	}

		    $("#widgetForm .close").click(function() {
		    	$("#widgetForm").remove();
		    });
		    $("#widgetForm .save").click(function() {
					var settings_raw = $( '#start :input').serializeArray();
					var settings_post = nw.functions.serializedArrayToValues(settings_raw);

					_.forEach(nw.fieldGetters, function(get, id) {
					    var value = get();
					    settings_post[id] = value;
					});

					delete settings_post['start-form_token'];
					var settings = nw.functions.expandPostValues(settings_post);
					console.log(settings);
		    	callback(settings);
		    });
	    }
	  });
	}

	function doProcess(token, input, success, error) {
		var data = {};
		data['token'] = token;
		data['widget'] = 'process';
		data['input'] = JSON.stringify(input);
		console.log('process called');
		console.log(input);
		$.ajax('/post', {type: 'POST', data: data, success: function(result) {
			console.log(result);
			success(result)
		}, error: function(result) {
			console.log(result);
			error(result)
		} });
	}

	function processModel(fields, model_data, callback) {
		var data = {};
		data['fields'] = JSON.stringify(fields);
		data['data'] = JSON.stringify(model_data);
		$.getJSON('/internal/process_model', data, function(result) {
			console.log(result);
			console.log('processed');
			callback(result);
		});
	}

	function getID() {
		if (!(docCookies.hasItem('clientID'))) {
			var id = makeid(16);
			docCookies.setItem('clientID', id, 60*60*24, '/', 'localhost:3000');
		}
		return docCookies.getItem('clientID');
	}

	function cleanErrors(base_id) {
		$('#'+base_id+' .has-error').removeClass('has-error');
		$('#'+base_id+' .error-message').remove();
	}

	function showErrors(base_id, validationErrors) {
		for (var field in validationErrors) {
			message = validationErrors[field];
			var id = base_id+'-'+field;
			$('#'+id).addClass('has-error');
			$('#'+id+' label').append('<span class="error-message"> ('+message+') </span>');
		}
	}

	function fillSettings(settings, scope, exclude) {
	  exclude = exclude || ['data'];
	  for(key in settings) {
	  	var value = settings[key];
	    if (value && (typeof value === 'string') && value.indexOf("{{") != -1 && (!_.contains(exclude, key))) {
	      var template = Handlebars.compile(value);
	      settings[key] = template(scope);
	    }
	  }
	  return settings;
	}

	function processActionResult(id, result) {
    if (result) {
		  if (result.get) {
				nw.fieldGetters[id] = result.get;
			}
		}
	}

	return {
		counter: {},
		model: {},
		fieldGetters: {},
		functions: {
			makeid: makeid,
			loadWidgetForm: loadWidgetForm,
			renderWidget: renderWidget,
			insertWidgetBefore: insertWidgetBefore,
			configureWidget: configureWidget,
			serializedArrayToValues: serializedArrayToValues,
			expandPostValues: expandPostValues,
			getWidgetSettingsModel: getWidgetSettingsModel,
			doProcess: doProcess,
			processModel: processModel,
			cleanErrors: cleanErrors,
			showErrors: showErrors,
			fillSettings: fillSettings,
			processActionResult: processActionResult
		},
		clientID: getID()
	};
}();
