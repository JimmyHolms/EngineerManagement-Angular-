'use strict';

export default function($routeProvider) {
  'ngInject';
  $routeProvider
    .when('/customerjobhistory', {
      template: '<customerjobhistory></customerjobhistory>',
      authenticate: 'user'
    });
}
