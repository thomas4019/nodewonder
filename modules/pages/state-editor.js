{{ id }}
<a href="" ng-click="deleteWidget(id)">X</a>
<button ng-click="delete(data)" ng-show="data.nodes.length > 0">Delete nodes</button>
<ul>
    <li ng-repeat="(zone_name, zone) in state[id].zones" id="{{ id }}-{{ zone_name }}" ng-include="'/modules/pages/state-editor-zone.js'"></li>
</ul>