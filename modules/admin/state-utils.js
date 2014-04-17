

/*function stateChanged() {
	setTimeout("$('#submit input').trigger('click');", 100);
}*/

zone_tag_targets = ['view'];

function setupWidgetSelector(id) {
	$(id).select2({
		width: 300,
		query: function (query) {
			var data = {more: false, results: []};
			var groups = {};
			
			var model = {text: 'Model', children: []};
			data.results.push(model);
			var fields = nw.expandPostValues(nw.serializedArrayToValues($('#wyobn3bP-fields :input').serializeArray())).fields;
			_.each(fields, function(field) {
				var w = JSON.parse(JSON.stringify(widgets[field.widget]));
				w.field = field.type;
				w.text = field.name;
				w.name = field.name;
				w.model = 'Model';
				model.children.push(w);
			});

			_.each(widgets, function(widget) {
				_.each(widget.tags, function(tag) {
					if (_.contains(zone_tag_targets, tag)) {
						if (!groups[tag]) {
							groups[tag] = {text: tag, children: []}
							data.results.push(groups[tag]);
						}
						if(!query.term || widget.text.indexOf(query.term) !== -1) {
							groups[tag].children.push(widget);
						}
					}
				});
			});
			query.callback(data);
		}
	});
}

function stateController($scope) {
	$scope.widgets = $scope.state.widgets || {};
	$scope.slotAssignments = $scope.state.slotAssignments;

	if (!($scope.slotAssignments)) {
		$scope.slotAssignments = {'body': []};
	}

	_.each($scope.widgets, function(w) {
		w.has_form = widgets[type].settings;
	});
	

	var _id, _slot;

	var select = $('#' + $scope.field_id + ' .widget-selector')

	select.on('select2-close', function() {
		select.select2("container").hide();
	});

	select.on('change', function (argument) {
		select.select2("container").hide();
		var selected = select.select2('data');
		console.log(selected);
		select.select2('val', '');
		var zones = {};
		_.each(selected.zones, function(zone_name, index) {
			zones[zone_name] = [];
		});
		//var zones = JSON.parse()
		var new_id = nw.makeid();
		$scope.widgets[new_id] = {type: selected.widget, slots: zones, has_form: selected.settings, field: selected.name, model_type: selected.field, model: selected.model, zone_tags: selected.zone_tags};
		if (_id == 'body') {
			$scope.slotAssignments['body'].push(new_id);
		} else {
			$scope.widgets[_id].slots[_slot].push(new_id);
		}
		$scope.$apply();
		//stateChanged();
		$scope.exportState();
	});

	select.select2("container").hide();

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
		var settings_model = widgets[type].settings;

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
		var select = $('#' + $scope.field_id + ' .widget-selector')
		if ($scope.widgets[id] && widgets[$scope.widgets[id].type]) {
			zone_tag_targets = widgets[$scope.widgets[id].type].zone_tags[slot] || ['view'];
		} else {
			zone_tag_targets = ['view'];
		}
		select.css({position: 'absolute', left: x, top: y })
		select.select2("container").show();
		select.select2("open");
	}

	$scope.exportState = function() {
		var cstate = {
			widgets: $scope.widgets,
			slotAssignments: $scope.slotAssignments
		};
		cstate['widgets'] = JSON.parse(JSON.stringify(cstate['widgets'])); //deep clone
		_.each(cstate['widgets'], function(widget, key) {
			delete widget['has_form'];
		});
		$('#' + $scope.field_id + ' .widget-code-editor').html(JSON.stringify(cstate));
		//setTimeout('document.getElementsByTagName("iframe")[0].contentWindow.location.reload();', 250);
	}
}