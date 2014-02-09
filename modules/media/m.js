module.exports = {
	widgets : {}
};
widgets = module.exports.widgets;

widgets.youtube_video = function (input) {
	this.form = function() {
		return  {
			"id" : {"name": "id", "type": "field_text", "label" : "Video ID", "value" : input.id}
		};
	}

	this.toHTML = function() {
		return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + input.id + '" frameborder="0" allowfullscreen></iframe>';
	}
}