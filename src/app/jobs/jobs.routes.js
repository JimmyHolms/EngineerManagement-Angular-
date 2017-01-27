'use strict';

export default function routes($routeProvider, $locationProvider) {
  'ngInject';

  $routeProvider.when('/addjob', {
    template: require('./addjob/addjob.html'),
    controller: 'AddJobComponent',
    controllerAs: 'addjobCtrl',
    authenticate: 'user'
  }).when('/editjob/:jid', {
    template: require('./editjob/editjob.html'),
    controller: 'EditJobComponent',
    controllerAs: 'editjobCtrl',
    authenticate: 'user'
  }).when('/managejobcategories', {
    template: require('./managecategories/managecategory.html'),
    controller: 'ManageCategoryComponent',
    controllerAs: 'managecategoryCtrl',
    authenticate: 'user'
  }).when('/joblistbyengineer', {
    template: require('./jobListByEngineer/joblistbyengineer.html'),
    controller: 'JobListByEngineerComponent',
    controllerAs: 'joblistCtrl',
    authenticate: 'user'
  });
  $locationProvider.html5Mode(true);
}
