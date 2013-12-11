var fs = require('fs'),
		Handlebars = require("handlebars");

var template = function(input) {
	var that = this;
	this.path = input.path;

	this.zones = {name : 'body'};

	this.isPage = function() {
		return true;
	}

	this.load = function(callback) {
		console.log(this.path);
		fs.readFile(this.path, 'utf8', function(err, data) {
		  if (err) {
		    return console.log(err);
		  }
		  that.template = Handlebars.compile(data);
		  callback();
		});
	}

	this.toHTML = function(zones) {
		console.log(this.template(zones));
		return this.template(zones);
	}
};
template.prototype.name = 'template';

var htmlFile = function(input) {
	var that = this;
	this.path = input.path;

	this.load = function(callback) {
		fs.readFile(this.path, 'utf8', function(err, data) {
		  if (err) {
		    return console.log(err);
		  }
		  that.template = data;
		  callback();
		});
	}

	this.toHTML = function() {
		return this.template;
	}
};
htmlFile.prototype.name = 'htmlfile';

module.exports = {
	widgets : [template, htmlFile],
}