'use strict';

export default function($routeProvider) {
  'ngInject';
  $routeProvider
    .when('/dashboard', {
      template: '<dashboard></dashboard>',
      authenticate: 'user'
    });
}
