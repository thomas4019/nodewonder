module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.youtube_video = {
  settingsModel: [ {"name": "id", "type": "Text", "label": "Video ID"} ],
	toHTML: function() {
    return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + this.settings.id + '" frameborder="0" allowfullscreen></iframe>';
  }
}