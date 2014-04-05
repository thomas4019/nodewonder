module.exports = {
  widgets : {}
};
widgets = module.exports.widgets;

widgets.youtube_video = function (input) {
  this.settings = function() {
    return  [ {"name": "id", "type": "String", "label": "Video ID"} ];
  }

  this.toHTML = function() {
    return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + input.id + '" frameborder="0" allowfullscreen></iframe>';
  }
}