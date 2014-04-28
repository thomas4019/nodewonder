function configureModelWidget(id) {
	var widget_id = id.replace('-settings', '-widget')
	var widget_type = $('#' + widget_id + ' select').val();

	var settings_text = $("#" + id + " textarea").text();
	var settings = settings_text ? JSON.parse(settings_text) : {};
	nw.functions.getWidgetSettingsModel(widget_type, function(err, settings_model) {

		nw.functions.configureWidget(id, settings_model, settings, function(new_settings) {
			console.log('processing model');
			nw.functions.cleanErrors('start');
			nw.functions.processModel(settings_model, new_settings, function(results) {
				console.log(results); 
				if (results.validationErrors && Object.keys(results.validationErrors).length) {
					console.log('model has errors');
					nw.functions.showErrors('start', results.validationErrors);
				} else {
					console.log('model success');
					$("#" + id + " textarea").text(JSON.stringify(results.data));
		    	$("#widgetForm").hide();
				}
			});
		});
	});
}