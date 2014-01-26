{{ state[id]['w'] }}
<a href="" ng-click="deleteWidget(id)"><i class="fa fa-trash-o fa-lg"></i></a>
<a href="" ng-click="configureWidget(id)"><i class="fa fa-cog fa-lg"></i></a>
<button ng-click="delete(data)" ng-show="data.nodes.length > 0">Delete nodes</button>

<div ng-repeat="(zone_name, zone) in state[id].zones" id="{{ id }}-{{ zone_name }}" ng-include="'/modules/pages/state-editor-zone.js'"></div>