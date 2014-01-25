{{ zone_name }} <button class="add" ng-click="addWidget(id, zone_name)">Add node</button>
<ul>
<li ng-repeat="id in zone" ng-if="state[id]" ng-include="'/modules/pages/state-editor.js'">{{ id }}</li>
</ul>