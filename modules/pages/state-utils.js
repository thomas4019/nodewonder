function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function expandState(state) {
	var map = {};

	state2 = {};

  _.each(state, function(w, key) {
    var parts = key.split(":");
    var id = parts[0];
    var name = parts[1];

    state2[id] = w;
    w.w = name;
  });

  return state2;
}

function compressState(state) {
	var map = {};

	state2 = {};

  _.each(state, function(w, id) {
    state2[id + ':' + w.w] = w;
  });

  return state2;
}

function exportState() {
	var cstate = angular.element($('#state-ctrl')).scope().state;
	$("textarea").text(JSON.stringify(compressState(cstate)));
	setTimeout('document.getElementsByTagName("iframe")[0].contentWindow.location.reload();', 250);
}

function getBaseWidgetIds(state) {
	var all_children = [];
	_.each(state, function(widget, key) {
		_.each(widget.zones, function(children, zone_name) {
			all_children = _.union(all_children, children);
		});
	});
	var all_ids = _.keys(state);
	all_ids = _.map(all_ids, function(key) {return key.split(':')[0]})
	var base_widget_ids = _.difference(all_ids, all_children)
	return base_widget_ids;
}

function stateChanged() {
	setTimeout("$('#submit input').trigger('click');", 100);
}

function stateController($scope) {
	$scope.state = expandState(state);	

	$scope.base_widgets = getBaseWidgetIds(state);

	var _id, _zone;

	$('.widget-selector').on('select2-close', function() {
		$('.widget-selector').select2("container").hide();
	});

	$('.widget-selector').on('change', function (argument) {
		$('.widget-selector').select2("container").hide();
		var type = $('.widget-selector').select2('val');
		$('.widget-selector').select2('val', '');
		var new_id = makeid();
		var zone_names = $('option[value="'+type+'"]').data('zones');
		var zones = {};
		_.each(zone_names, function(zone_name, index) {
			zones[zone_name] = [];
		});
		//var zones = JSON.parse()
		$scope.state[new_id] = {w: type, zones: zones};
		if (_id == 'base') {
			$scope.base_widgets.push(new_id);
		} else {
			$scope.state[_id].zones[_zone].push(new_id);
		}
		$scope.$apply();
		stateChanged();
	});

	$('.widget-selector').select2("container").hide();

	$scope.deleteWidget = function(id) {
		delete $scope.state[id];
		$scope.base_widgets = _.without($scope.base_widgets, id);
		stateChanged();
	}	

	$scope.configureWidget = function(id) {
		$("#widgetForm").remove();
		x = $('#'+id+' .configure').offset().left;
		y = $('#'+id+' .configure').offset().top;
		//var ne = document.createElement( "div" );
		var ne = $( '<div id="widgetForm" style="left:'+x+'px; top:'+y+'px;" />' )
		$('body').append(ne);
		//ne.html('hello world');
		var type = $scope.state[id].w;
		var data = {};
		data['start-widget_type'] = type;
		data['start-widget_id'] = id;
		//data['start-input'] = '{id:wjarzQWtBwM}';//'%7B"id"%3A"wjarzQWtBwM"%7D';
		data['start-widget_page'] = page;
		//?start-type=youtube_video&start-input=%7B"id"%3A"wjarzQWtBwM"%7D&start-show_form=true
		$.getJSON('/internal/page_widget', data, function(result) {
	    if (result.error) {
	    	$("#widgetForm").remove();
	    } else {
	    	var form_begin = '<form action="/post" method="post" >' + 
	    	'<input type="hidden" name="widget" value="page_widget_form">' +
	    	'<input type="hidden" name="widget_page" value="' + page + '">' +
	    	'<input type="hidden" name="widget_id" value="' + id + '">' +
	    	'<input type="hidden" name="widget_type" value="' + type + '">';
				$("#widgetForm").html(form_begin + result.html + '<input type="submit" class="save" value="Save"> </form>' + '<div class="close">X</div>');
		    $("#widgetForm .close").click(function() {
		    	$("#widgetForm").remove();
		    });
		    $("#widgetForm .save").click(function() {
		    	exportState();
		    	$("#widgetForm").hide();
		    });
	    }
	  });
	}	

	$scope.addWidget = function (id, zone) {
		_id = id;
		_zone = zone;
		x = $('#'+id+'-'+zone+' .add').offset().left;
		y = $('#'+id+'-'+zone+' .add').offset().top;
		$('.widget-selector').css({position: 'absolute', left: x, top: y })
		$('.widget-selector').select2("container").show();
		$('.widget-selector').select2("open");
	}

	$scope.saveState = function() {
		$('textarea').text(JSON.stringify(compressState($scope.state)));
	}
}