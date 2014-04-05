var nw = function() {
	function makeid() {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < 8; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	}

	function expandPostValues(values) {
		var data = {};
		var tocheck = [];

		_.each(values, function(value, key) {
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
				current[last] = value;
			}
		});

		function hasValues(value) {
			if (typeof value == 'object') {
				for (var key in value)
					if (hasValues(value[key]))
						return true;

				return false;
			}

			return value;
		}

		_.each(tocheck, function(key, index) {
			data[key] = _.filter(data[key], function(value) {
				return hasValues(value);
			});
		});

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
		data['start-widget_id'] = id;
		data['start-widget_type'] = type;
		data['start-input'] = input;
		$.getJSON('/internal/render_widget', data, function(result) {
			callback(result);
		});
	}

	function insertWidgetBefore(type, id, input, selector) {
		renderWidget(type, id, input, function(result) {
			console.log(result);
			$(selector).before(result.html);
			eval(result.javascript);
		});	
	}

	function configureWidget(id) {
		var widget_id = id.replace('-input', '-widget')
		var widget_type = $('#' + widget_id + ' select').val();
		$("#widgetForm").remove();
		x = $('#'+id+' .configure').offset().left;
		y = $('#'+id+' .configure').offset().top;
		//var ne = document.createElement( "div" );
		var ne = $( '<div id="widgetForm" style="left:'+x+'px; top:'+y+'px;" />' )
		$('body').append(ne);
		//ne.html('hello world');
		var data = {};
		data['start-widget_input'] = JSON.stringify({});
		data['start-widget_type'] = widget_type;
		//data['start-input'] = '{id:wjarzQWtBwM}';//'%7B"id"%3A"wjarzQWtBwM"%7D';
		//data['start-widget_page'] = page;
		//?start-type=youtube_video&start-input=%7B"id"%3A"wjarzQWtBwM"%7D&start-show_form=true
		$.getJSON('/internal/page_widget', data, function(result) {
	    if (result.error) {
	    	$("#widgetForm").remove();
	    } else {
	    	var form_begin = '<form action="/post" method="post" >';
	    	//'<input type="hidden" name="widget" value="page_widget_form">' +
	    	//'<input type="hidden" name="widget_id" value="' + id + '">';
				$("#widgetForm").html('<div>' + id + '</div>' + form_begin + result.html + '<input type="button" class="save" value="Save"></input> </form>' + '<div class="close">X</div>');
		    $("#widgetForm .close").click(function() {
		    	$("#widgetForm").remove();
		    });
		    $("#widgetForm .save").click(function() {
		    	//$scope.exportState();
		    	var values = $("#widgetForm form").serializeArray();
		    	var map = {};
		    	for (var i = 0; i < values.length; i++) {
		    		map[values[i].name] = values[i].value;
		    	}
		    	console.log(map);
		    	$('#' + id + '-text').text(JSON.stringify(map));
		    	$("#widgetForm").hide();
		    });
	    }
	  });
	}

	return {
		makeid: makeid,
		loadWidgetForm: loadWidgetForm,
		renderWidget: renderWidget,
		insertWidgetBefore: insertWidgetBefore,
		configureWidget: configureWidget,
		expandPostValues: expandPostValues
	};
}();