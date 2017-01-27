'use strict';

export function routeConfig($routeProvider, $locationProvider, $httpProvider) {
  'ngInject';
  $routeProvider.otherwise({
    redirectTo: '/login'
  });

  $locationProvider.html5Mode(true);
}
