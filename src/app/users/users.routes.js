'use strict';

export default function routes($routeProvider) {
  'ngInject';

  $routeProvider.when('/adduser', {
      template: require('./adduser/adduser.html'),
      controller: 'AdduserComponent',
      controllerAs: 'adduserCtrl',
      authenticate: 'admin'
    }).when('/edituser/:user_id', {
      template: require('./edituser/edituser.html'),
      controller: 'EditUserComponent',
      controllerAs: 'edituserCtrl',
      authenticate: 'admin'
    }).
    when('/userlist',{
      template: require('./userlist/userlist.html'),
      controller:'UserlistComponent',
      controllerAs:'userlistCtrl',
      authenticate:'admin'
    });
}