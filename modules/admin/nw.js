var nw = function() {
	function makeid() {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < 8; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
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

	return {
		makeid: makeid,
		loadWidgetForm: loadWidgetForm,
		renderWidget: renderWidget,
		insertWidgetBefore: insertWidgetBefore
	};
}();