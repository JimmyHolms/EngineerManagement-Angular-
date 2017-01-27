'use strict';
const angular = require('angular');
import * as properties from '../../../properties';
export default class customerchangepasswordComponent {
  /*@ngInject*/
  constructor($http, $scope,Auth) {
   this.$http = $http;
        
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.getCurrentUser = Auth.getCurrentUserSync;
  $(".alert").hide();   //Hides all the BS alerts on the page
    $(".scroll-to-top").click();
      $scope.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
       $scope.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    } 

$scope.PasswordReset = {
  oldPassword: '',
  newPassword: ''
};
  
   $scope.updatePassword = function () {     
   
     if($scope.PasswordReset.oldPassword !== '' && $scope.PasswordReset.newPassword !== '') 
     {     
       var config = {headers:  {
        'Authorization': 'Bearer '+ Auth.getToken(),
        'Content-Type': 'application/json'
       
    }
   
};

    $http.put(properties.customerChangePassword_path,$scope.PasswordReset,config).then(function successCallback(response) {
  
     $scope.showSuccessAlert();
  }, 
  function errorCallback(response) {
   
    $scope.showFailureAlert();
   
  });
    }
   }    
    $(".scroll-to-top").click();
  }

  
}

