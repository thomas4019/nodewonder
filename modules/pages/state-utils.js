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
}

function stateController($scope) {
	$scope.state = expandState(state);

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
		$scope.state[_id].zones[_zone].push(new_id);
		$scope.$apply();
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
		$('.widget-selector').select2("open");
	}

	$scope.saveState = function() {
		$('textarea').text(JSON.stringify(compressState($scope.state)));
	}
}