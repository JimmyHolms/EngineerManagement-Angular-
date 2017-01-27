'use strict';

export default function routes($routeProvider) {
  'ngInject';
  $routeProvider.when('/login', {
    template: require('./login/login.html'),
    controller: 'LoginController',
    controllerAs: 'vm'
  })
    .when('/logout', {
      name: 'logout',
      referrer: '/',
      template: '',
      controller: function ($location, $route, Auth) {
        var referrer = $route.current.params.referrer || $route.current.referrer || '/';
        Auth.logout();
        $location.path(referrer);
      }
    })
    .when('/signup', {
      template: require('./signup/signup.html'),
      controller: 'SignupController',
      controllerAs: 'vm'
    }) 
    .when('/customerforgotpassword', {
      template: require('./customerforgotpassword/customerforgotpassword.html'),
      controller: 'customerforgotpasswordController',
      controllerAs: 'vm'
    })
    .when('/settings', {
      template: require('./settings/settings.html'),
      controller: 'SettingsController',
      controllerAs: 'vm',
      authenticate: true
    })
    .when('/reset/:reset_id', {
      template: require('./reset/reset.html'),
      controller: 'ResetPasswordController',
      controllerAs: 'vm'
    });
}
