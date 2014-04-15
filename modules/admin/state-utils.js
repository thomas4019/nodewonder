

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
		w.has_form = $('option[value="'+w.type+'"]').data('settings');
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
		var has_form = $('option[value="'+type+'"]').data('settings');
		var field = $('option[value="'+type+'"]').data('field');
		var model_type = $('option[value="'+type+'"]').data('type');
		var model = $('option[value="'+type+'"]').data('model');
		var zones = {};
		_.each(zone_names, function(zone_name, index) {
			zones[zone_name] = [];
		});
		//var zones = JSON.parse()
		$scope.widgets[new_id] = {type: type, slots: zones, has_form: has_form, field: field, model_type: model_type, model: model};
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
		var type = $scope.widgets[id].type;
		var settings = $scope.widgets[id].settings;
		var settings_model = $('option[value="'+type+'"]').data('settings');

		nw.configureWidget(id, settings_model, settings, function(new_settings) {
			$scope.widgets[id].settings = new_settings;
		  $scope.exportState();
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
		$('.widget-code-editor').html(JSON.stringify(cstate));
		console.log($scope);
		//setTimeout('document.getElementsByTagName("iframe")[0].contentWindow.location.reload();', 250);
	}
}