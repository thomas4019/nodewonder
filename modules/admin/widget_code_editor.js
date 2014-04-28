zone_tag_targets = ['view'];

function setupWidgetSelector(id) {
	$(id).select2({
		width: 300,
		query: function (query) {
			var data = {more: false, results: []};
			var groups = {};
			
			if ( $('#wyobn3bP-fields') ) {
				var model = {text: 'Model', children: []};
				data.results.push(model);
				var fields = nw.functions.expandPostValues(nw.functions.serializedArrayToValues($('#wyobn3bP-fields :input').serializeArray())).fields;
				_.each(fields, function(field) {
					if(!query.term || field.name.indexOf(query.term) !== -1) {
						var w = JSON.parse(JSON.stringify(nw.widgets[field.widget]));
						w.field = field.type;
						w.text = field.name;
						w.name = field.name;
						w.model = 'Model';
						model.children.push(w);
					}
				});
			}

			_.each(nw.widgets, function(widget) {
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
	$scope.menu = false;

	if (!($scope.slotAssignments)) {
		$scope.slotAssignments = {'body': []};
	}

	_.each($scope.widgets, function(w) {
		w.has_form = nw.widgets[w.type].settings;
	});
	

	var _id, _slot;

	var select = $('#' + $scope.field_id + ' .widget-selector')

	select.on('select2-close', function() {
		select.select2("container").hide();
	});

	select.on('change', function (argument) {
		select.select2("container").hide();
		var selected = select.select2('data');
		select.select2('val', '');
		var zones = {};
		_.each(selected.zones, function(zone_name, index) {
			zones[zone_name] = [];
		});
		//var zones = JSON.parse()
		var new_id = nw.functions.makeid(8);
		if (selected.model)
			$scope.widgets[new_id] = {type: selected.widget, slots: zones, has_form: selected.settings, field: selected.name, model_type: selected.field, model: selected.model, zone_tags: selected.zone_tags};
		else
			$scope.widgets[new_id] = {type: selected.widget, slots: zones, has_form: selected.settings, zone_tags: selected.zone_tags};
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

	var slotSelect = $('#' + $scope.field_id + ' .slot-selector')

	slotSelect.select2({
		width: 300,
		query: function (query) {
			var data = {more: false, results: []};
			_.each(widgets[$scope.widgets[_id].type].zones, function(zone) {
				data.results.push({"id":zone, "text": zone});	
			});
			query.callback(data);
		}
	});
	slotSelect.select2('container').hide();

	slotSelect.on('select2-close', function() {
		slotSelect.select2("container").hide();
	});

	slotSelect.on('change', function (argument) {
		slotSelect.select2("container").hide();
		var selected = slotSelect.select2('data');
		$scope.widgets[_id].slots[selected.id] = [];
		$scope.$apply();
	});

	$scope.deleteWidgetRecur = function(id) {
		_.each($scope.widgets[id].slots, function(slot, slot_name) {
			_.each(slot, function(id) {
				$scope.deleteWidgetRecur(id);
			});
		});
		if ($scope.widgets[id]) {
			delete $scope.widgets[id];
			_.each($scope.widgets, function(widget) {
				_.each(widget.slots, function(slot, slot_name) {
					widget.slots[slot_name] = _.without(slot, id);
				})
			});
			$scope.slotAssignments['body'] = _.without($scope.slotAssignments['body'], id);
		}
		//stateChanged();
		$scope.exportState();
	}	

	$scope.deleteWidget = function(id) {
		if ($scope.widgets[id]) {
			delete $scope.widgets[id];
			_.each($scope.widgets, function(widget) {
				_.each(widget.slots, function(slot, slot_name) {
					widget.slots[slot_name] = _.without(slot, id);
				})
			});
			$scope.slotAssignments['body'] = _.without($scope.slotAssignments['body'], id);
		}
		//stateChanged();
		$scope.exportState();
	}	

	$scope.configureWidget = function(id) {
		var type = $scope.widgets[id].type;
		var settings = $scope.widgets[id].settings;
		var settings_model = nw.widgets[type].settings;

		nw.functions.configureWidget(id, settings_model, settings, function(new_settings) {
			$scope.widgets[id].settings = new_settings;
		  $scope.exportState();
		  $("#widgetForm").hide();
		});
	}	

	$scope.addWidget = function (id, slot) {
		_id = id;
		_slot = slot;
		x = $('#'+id+'-'+slot+' .add').offset().left;
		y = $('#'+id+'-'+slot+' .add').offset().top;
		var select = $('#' + $scope.field_id + ' .widget-selector')
		if ($scope.widgets[id] && nw.widgets[$scope.widgets[id].type]) {
			zone_tag_targets = nw.widgets[$scope.widgets[id].type].zone_tags[slot] || ['view'];
		} else {
			zone_tag_targets = ['view'];
		}
		select.css({position: 'absolute', left: x, top: y })
		select.select2("container").show();
		select.select2("open");
	}

	$scope.addSlot = function (id, slot) {
		_id = id;
		_slot = slot;
		x = $('#'+id+' .addSlot').offset().left;
		y = $('#'+id+' .addSlot').offset().top;
		var select = $('#' + $scope.field_id + ' .slot-selector')
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
			delete widget['cut'];
			delete widget['selected'];
			delete widget['zone_tags'];
		});
		$('#' + $scope.field_id + ' .widget-code-editor').html(JSON.stringify(cstate));
	}

	$scope.deleteSelected = function() {
		_.each($scope.widgets, function(widget, index) {
			if(widget.selected) {
				$scope.deleteWidgetRecur(index);
			}
		});
		$scope.check();
	}

	$scope.cutSelected = function() {
		_.each($scope.widgets, function(widget, index) {
			widget.cut = widget.selected;
			widget.selected = false;
		});
		$scope.cut = true;
		$scope.check();
	}

	$scope.pasteAt = function(_id, _slot) {
		_.each($scope.widgets, function(widget, id) {
			if(widget.cut) {
				$scope.deleteWidget(id);

				if (_id == 'body') {
					$scope.slotAssignments['body'].push(id);
				} else {
					$scope.widgets[_id].slots[_slot].push(id);
				}
				$scope.widgets[id] = widget;
				widget.cut = false;
			}
		});
		$scope.cut = false;
		$scope.exportState();
	}

	$scope.check = function(element) {
		var count = 0;
		_.each($scope.widgets, function(widget) {
			if(widget.selected)
				count++;
		});
		$scope.menu = count ? true : false;
	}

	$scope.exportState();
}