'use strict';

export default function routes($routeProvider) {
  'ngInject';

  $routeProvider.when('/addcustomer', {
    template: require('./addcustomer/addcustomer.html'),
    controller: 'AddCustomerComponent',
    controllerAs: 'addcustomerCtrl',
    authenticate: 'user'
  }).when('/editcustomer/:customer_id', {
    template: require('./editcustomer/editcustomer.html'),
    controller: 'EditCustomerComponent',
    controllerAs: 'editcustomerCtrl',
    authenticate: 'user'
  }).when('/customerlist', {
    template: require('./customerlist/customerlist.html'),
    controller: 'CustomerListComponent',
    controllerAs: 'customerlistCtrl',
    authenticate: 'user'
  }).when('/customerapproval', {
    template: require('./customerapproval/customerapproval.html'),
    controller: 'CustomerApprovalComponent',
    controllerAs: 'customerlistCtrl',
    authenticate: 'user'
  });

    $routeProvider.when('/customerprofile', {
      template: require('./customerprofile/customerprofile.html'),
      controller: 'customerprofileComponent',
      controllerAs: 'customerprofileCtrl',
      authenticate: 'user'
    });

  $routeProvider.when('/updatecustomerprofile', {
      template: require('./updatecustomerprofile/updatecustomerprofile.html'),
      controller: 'updatecustomerprofileComponent',
      controllerAs: 'updatecustomerprofileCtrl',
      authenticate: 'user'
    });

    
  $routeProvider.when('/postjobcustomer', {
      template: require('./postjobcustomer/postjobcustomer.html'),
      controller: 'postjobcustomerComponent',
      controllerAs: 'postjobcustomerCtrl',
      authenticate: 'user'
    });
    
 

     $routeProvider.when('/registrationcustomer', {
      template: require('./registrationcustomer/registrationcustomer.html'),
      controller: 'registrationcustomerComponent',
      controllerAs: 'registercustomerCtrl'
     // authenticate: 'user'
    });
    $routeProvider.when('/customerchangepassword', {
      template: require('./customerchangepassword/customerchangepassword.html'),
      controller: 'customerchangepasswordComponent',
      controllerAs: 'customerchangepasswordCtrl',
      authenticate: 'user'
    });
}