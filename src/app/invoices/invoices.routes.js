'use strict';

export default function routes($routeProvider) {
  'ngInject';

  $routeProvider.when('/activeinvoices', {
    template: require('./activeinvoices/activeinvoices.html'),
    controller: 'activeinvoicesComponent',
    controllerAs: 'activeinvoicesCtrl',
    authenticate: 'user'
  }).when('/paidinvoices', {
      template: require('./paidinvoices/paidinvoices.html'),
   controller: 'paidinvoicesComponent',
  controllerAs: 'paidinvoicesCtrl',
    authenticate: 'user'
  }).when('/submittedinvoices', {
      template: require('./submittedinvoices/submittedinvoices.html'),
   controller: 'submittedinvoicesComponent',
  controllerAs: 'submittedinvoicesCtrl',
    authenticate: 'user'
  }).when('/approvedinvoices', {
      template: require('./approvedinvoices/approvedinvoices.html'),
   controller: 'approvedinvoicesComponent',
  controllerAs: 'approvedinvoicesCtrl',
    authenticate: 'user'
  }).when('/aprovedcustomerinvoices', {
      template: require('./aprovedcustomerinvoices/aprovedcustomerinvoices.html'),
   controller: 'aprovedcustomerinvoicesComponent',
  controllerAs: 'aprovedcustomerinvoicesCtrl',
    authenticate: 'user'
  });
}