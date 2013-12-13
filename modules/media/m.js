module.exports = {
	widgets : {}
};
widgets = module.exports.widgets;

widgets.youtube_video = function (input) {
	this.id = input.id;

	this.input = function() {
		return  {
			"start:echo" : {"zones" : {"body" : ["id"] }},
			"id:field_text" : {"label" : "Video ID", "value" : input.id}
		};
	}

	this.toHTML = function() {
		return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + this.id + '" frameborder="0" allowfullscreen></iframe>';
	}
}