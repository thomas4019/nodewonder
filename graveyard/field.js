function model_field_type_setup(type_id) {
	return;
	var widget_id = type_id.replace('-type', '-widget');
	var type = $('#'+type_id+ ' select').val();
	var options = nw.edit_widgets[type];

	if (!type) {
		options = [];
	} else if (!options) {
		options = ['model_form'];
	}

	var select = $('#'+widget_id+ ' select');
	var val = select.val();
	var optionsAsString = "";
	for(var i = 0; i < options.length; i++) {
		optionsAsString += "<option value='" + options[i] + "'" + (val == options[i] ? ' selected="selected" ': '') + ">" + options[i] + "</option>";
	}
	select.html(optionsAsString);
}