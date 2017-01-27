'use strict';

export default function routes($routeProvider) {
  'ngInject';

  $routeProvider.when('/addengineer', {
    template: require('./addengineer/addengineer.html'),
    controller: 'AddEngineerComponent',
    controllerAs: 'addengineerCtrl',
    authenticate: 'user'
  }).when('/editengineer/:eng_id', {
    template: require('./editengineer/editengineer.html'),
    controller: 'EditEngineerComponent',
    controllerAs: 'editengineerCtrl',
    authenticate: 'user'
  }).when('/engineerlist', {
    template: require('./engineerlist/engineerlist.html'),
    controller: 'EngineerListComponent',
    controllerAs: 'engineerCtrl',
    authenticate: 'user'
  }).when('/engineerapproval', {
    template: require('./engineerapproval/engineerapproval.html'),
    controller: 'EngineerApprovalComponent',
    controllerAs: 'engineerCtrl',
    authenticate: 'user'
  }).when('/engineercalendar', {
    template: require('./engineercalendar/engineercalendar.html'),
    controller: 'EngineerCalendarComponent',
    controllerAs: 'calendarCtrl',
    authenticate: 'user'
  });
}