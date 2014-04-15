function configureModelWidget(id) {
	var widget_id = id.replace('-settings', '-widget')
	var widget_type = $('#' + widget_id + ' select').val();

	var settings_text = $("#" + id + " textarea").text();
	var settings = settings_text ? JSON.parse(settings_text) : {};
	nw.getWidgetSettingsModel(widget_type, function(err, settings_model) {

		nw.configureWidget(id, settings_model, settings, function(new_settings) {
			console.log(new_settings);
			$("#" + id + " textarea").text(JSON.stringify(new_settings));
		});
	});
}