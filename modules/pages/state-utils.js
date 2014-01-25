function expandState(state) {
	var map = {};

  _.each(state, function(w, key) {
    var parts = key.split(":");
    var id = parts[0];
    var name = parts[1];
    map[id] = w;
  });

  _.each(state, function(w, key) {
    var parts = key.split(":");
    var id = parts[0];
    var name = parts[1];

    state[id] = w;

    /*if (w.zones) {
      _.each(w.zones, function(subwidgets, zone) {
      	_.each(subwidgets, function(subid, index) {
      		w.zones[zone][index] = map[subid];
      	});
      });
    }*/
  });

  return state;
}

function stateController($scope) {
	$scope.state = expandState(state);

	var _id, _zone;

	$('.widget-selector').on('change', function (argument) {
		$('.widget-selector').select2("container").hide();
		var type = $('.widget-selector').select2('val');
		$scope.state[type] = {'id': '123345'};
		$scope.state[_id].zones[_zone].push(type);
		$scope.$apply();
		console.log($scope.state);
	});

	$('.widget-selector').select2("container").hide();

	$scope.deleteWidget = function(id) {
		delete $scope.state[id];
	}

	$scope.addWidget = function (id, zone) {
		_id = id;
		_zone = zone;
		x = $('#'+id+'-'+zone+' .add').offset().left;
		y = $('#'+id+'-'+zone+' .add').offset().top;
		$('.widget-selector').css({position: 'absolute', left: x, top: y })
		$('.widget-selector').select2("container").show();
	}
}