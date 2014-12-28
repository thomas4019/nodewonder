slot_tag_targets = ['view'];

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
				_.each(fields, function(kv) {
					field = kv.value;
					if (field.name) {
						if(!query.term || field.name.toUpperCase().indexOf(query.term.toUpperCase()	) !== -1) {
							var w = JSON.parse(JSON.stringify(nw.widgets[field.widget]));
							w.field = field.type;
							w.text = field.name;
							w.name = field.name;
							w.model = 'Model';
							model.children.push(w);
						}
					}
				});
			}

			_.each(nw.widgets, function(widget) {
				_.each(widget.tags, function(tag) {
					if (_.contains(slot_tag_targets, tag)) {
						if (!groups[tag]) {
							groups[tag] = {text: tag, children: []}
							data.results.push(groups[tag]);
						}
						if(!query.term || widget.text.toUpperCase().indexOf(query.term.toUpperCase()) !== -1) {
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
		w.has_form = nw.widgets[w.pseudo_widget ? w.pseudo_widget : w.type].settings;
	});

	$scope.field_widgets = {};

	for (type in $scope.edit_widgets) {
		$scope.field_widgets[type] = $scope.field_widgets[type] || [];
		for (var i in $scope.edit_widgets[type]) {
			var widget = $scope.edit_widgets[type][i];
			//$scope.field_widgets[type].push({widget: widget, group: 'edit'});
			$scope.field_widgets[type].push(widget);
		}
	}
	for (type in $scope.view_widgets) {
		$scope.field_widgets[type] = $scope.field_widgets[type] || [];
		for (var i in $scope.view_widgets[type]) {
			var widget = $scope.view_widgets[type][i];
			//$scope.field_widgets[type].push({widget: widget, group: 'view'});
		}
	}

	var _id, _slot;

	var select = $('#' + $scope.field_id + ' .widget-selector')

	select.on('select2-close', function() {
		select.select2("container").hide();
	});

	select.on('change', function (argument) {
		select.select2("container").hide();
		var selected = select.select2('data');
		select.select2('val', '');
		var slots = {};
		_.each(selected.slots, function(slot_name, index) {
			slots[slot_name] = [];
		});
		//var slots = JSON.parse()
		var new_id = selected.model ? selected.name : nw.functions.makeid(8);
		if (selected.model)
			$scope.widgets[new_id] = {type: selected.widget, slots: slots, has_form: selected.settings, field: selected.name, model_type: selected.field, model: selected.model, slot_tags: selected.slot_tags};
		else
			$scope.widgets[new_id] = {type: selected.widget, slots: slots, has_form: selected.settings, slot_tags: selected.slot_tags};

		if (selected.id != selected.widget) {
			$scope.widgets[new_id]['pseudo_widget'] = selected.id;
			$scope.widgets[new_id].settings = $scope.widgets[new_id].settings || {};
			$scope.widgets[new_id].settings['pseudo_widget']= selected.id;
		}

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
			_.each(widgets[$scope.widgets[_id].type].slots, function(slot) {
				data.results.push({"id":slot, "text": slot});
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
		if (typeof type == 'object') {
			type = type.widget;
		}
		console.log(type);
		var pseudo_widget = $scope.widgets[id].pseudo_widget;
		var settings = $scope.widgets[id].settings;
		var settings_model = nw.widgets[pseudo_widget ? pseudo_widget : type].settings;

		nw.functions.configureWidget(id, settings_model, settings, function(new_settings) {
			console.log(new_settings);
			console.log('configure finished');

			nw.functions.cleanErrors('start');
			nw.functions.processModel(settings_model, new_settings, function(results) {
				console.log(results);
				if (results.validationErrors && Object.keys(results.validationErrors).length) {
					console.log('model has errors');
					nw.functions.showErrors('start', results.validationErrors);
				} else {
					$scope.widgets[id].settings = results.data;
					$scope.widgets[id].settings['pseudo_widget'] = pseudo_widget;
				  $scope.exportState();
				  $("#widgetForm").remove();
				}
			});

		});
	}

	$scope.addWidget = function (id, slot) {
		_id = id;
		_slot = slot;
		x = $('#'+id+'-'+slot+' .add').offset().left;
		y = $('#'+id+'-'+slot+' .add').offset().top;
		var select = $('#' + $scope.field_id + ' .widget-selector')
		if ($scope.widgets[id] && nw.widgets[$scope.widgets[id].type]) {
			slot_tag_targets = nw.widgets[$scope.widgets[id].type].slot_tags[slot] || ['view', 'field_view'];
		} else {
			slot_tag_targets = ['view', 'field_view'];
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
			slot_tag_targets = widgets[$scope.widgets[id].type].slot_tags[slot] || ['view'];
		} else {
			slot_tag_targets = ['view'];
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
			delete widget['slot_tags'];
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
