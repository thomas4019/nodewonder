function model_field_type_setup(type_id) {
	var widget_id = type_id.replace('-type', '-widget');
	var type = $('#'+type_id+ ' select').val();
	var options = edit_widgets[type];

	if (!options) {
		options = ['model_form'];
	}

	var select = $('#'+widget_id+ ' select');
	var optionsAsString = "";
	for(var i = 0; i < options.length; i++) {
		optionsAsString += "<option value='" + options[i] + "'>" + options[i] + "</option>";
	}
	select.html(optionsAsString);
}