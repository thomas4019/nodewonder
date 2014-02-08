<i>{{ zone_name }}</i> <a class="add" ng-click="addWidget(id, zone_name)"><i class="fa fa-plus fa-lg"></i></a>
<ul>
<li id="{{ id }}" ng-repeat="id in zone" ng-if="state[id]" ng-include="'/modules/pages/state-editor.js'"></li>
</ul>