function configureModelWidget(id) {
	var widget_id = id.replace('-settings', '-widget')
	var widget_type = $('#' + widget_id + ' select').val();

	var settings_text = $("#" + id + " textarea").text();
	var settings = settings_text ? JSON.parse(settings_text) : {};
	nw.functions.getWidgetSettingsModel(widget_type, function(err, settings_model) {
		nw.functions.configureWidget(id, settings_model, settings, function(new_settings) {
			nw.functions.processModel(settings_model, new_settings, function(results) {
				var processed_settings = JSON.parse(results.html);
				console.log(processed_settings);
				$("#" + id + " textarea").text(JSON.stringify(processed_settings));
			});
		});
	});
}