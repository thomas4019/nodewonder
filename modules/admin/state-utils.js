

/*function stateChanged() {
	setTimeout("$('#submit input').trigger('click');", 100);
}*/

function stateController($scope) {
	$scope.widgets = state.widgets || {};
	$scope.slotAssignments = state.slotAssignments;

	if (!($scope.slotAssignments)) {
		$scope.slotAssignments = {'body': []};
	}

	_.each($scope.widgets, function(w) {
		w.has_form = $('option[value="'+w.type+'"]').data('form');
	});
	

	var _id, _slot;

	$('.widget-selector').on('select2-close', function() {
		$('.widget-selector').select2("container").hide();
	});

	$('.widget-selector').on('change', function (argument) {
		$('.widget-selector').select2("container").hide();
		var type = $('.widget-selector').select2('val');
		$('.widget-selector').select2('val', '');
		var new_id = nw.makeid();
		var zone_names = $('option[value="'+type+'"]').data('zones');
		var has_form = $('option[value="'+type+'"]').data('form');
		var zones = {};
		_.each(zone_names, function(zone_name, index) {
			zones[zone_name] = [];
		});
		//var zones = JSON.parse()
		$scope.widgets[new_id] = {type: type, slots: zones, has_form: has_form};
		if (_id == 'body') {
			$scope.slotAssignments['body'].push(new_id);
		} else {
			$scope.widgets[_id].slots[_slot].push(new_id);
		}
		$scope.$apply();
		//stateChanged();
		$scope.exportState();
	});

	$('.widget-selector').select2("container").hide();

	$scope.deleteWidget = function(id) {
		delete $scope.widgets[id];
		_.each($scope.widgets, function(widget) {
			_.each(widget.slots, function(slot, slot_name) {
				widget.slots[slot_name] = _.without(slot, id);
			})
		});
		$scope.slotAssignments['body'] = _.without($scope.slotAssignments['body'], id);
		//stateChanged();
		$scope.exportState();
	}	

	$scope.configureWidget = function(id) {
		$("#widgetForm").remove();
		x = $('#'+id+' .configure').offset().left;
		y = $('#'+id+' .configure').offset().top;
		//var ne = document.createElement( "div" );
		var ne = $( '<div id="widgetForm" style="left:'+x+'px; top:'+y+'px;" />' )
		$('body').append(ne);
		//ne.html('hello world');
		var data = {};
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
				$("#widgetForm").html('<div>' + id + '</div>' + form_begin + result.html + '<input type="submit" class="save" value="Save"> </form>' + '<div class="close">X</div>');
		    $("#widgetForm .close").click(function() {
		    	$("#widgetForm").remove();
		    });
		    $("#widgetForm .save").click(function() {
		    	$scope.exportState();
		    	$("#widgetForm").hide();
		    });
	    }
	  });
	}	

	$scope.addWidget = function (id, slot) {
		_id = id;
		_slot = slot;
		x = $('#'+id+'-'+slot+' .add').offset().left;
		y = $('#'+id+'-'+slot+' .add').offset().top;
		$('.widget-selector').css({position: 'absolute', left: x, top: y })
		$('.widget-selector').select2("container").show();
		$('.widget-selector').select2("open");
	}

	$scope.exportState = function() {
		var $scope = angular.element($('#state-ctrl')).scope();
		var cstate = {
			widgets: $scope.widgets,
			slotAssignments: $scope.slotAssignments
		};
		cstate['widgets'] = JSON.parse(JSON.stringify(cstate['widgets'])); //deep clone
		_.each(cstate['widgets'], function(widget, key) {
			delete widget['has_form'];
		});
		$('.widget-code-editor').attr('value', JSON.stringify(cstate));
		//setTimeout('document.getElementsByTagName("iframe")[0].contentWindow.location.reload();', 250);
	}
}