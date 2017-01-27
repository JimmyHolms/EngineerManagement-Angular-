'use strict';
import { ReadableAddress } from '../../../Utility/Utility';
import * as properties from '../../../properties';
export default class customerprofileComponent {
  /*@ngInject*/
  constructor($http, $scope,Auth) {
     this.$http = $http;     
    
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.getCurrentUser = Auth.getCurrentUserSync;
       $(".scroll-to-top").click();
   $scope.getid = Auth.getCurrentUserSync();
    $scope.Profile= Auth.getCurrentUserSync();

      $scope.ifs = 'http://'+  $scope.Profile.image_path;
    
     if($scope.ifs == 'http://null'){
      
        $('#customer_photo').attr('src', "/assets/images/avatar.jpg");


     }
     else{
      
       $scope.Image = 'http://'+  $scope.Profile.image_path;
          $('#customer_photo').attr('src',  $scope.Image );
             $http.get(properties.customer_path+"/"+ $scope.getid.id).then(function successCallback(response) {
  
    $scope.Image = 'http://'+ response.data.image_path;
     $scope.Profile= response.data;
  
  }, 
  function errorCallback(response) {
   
  //  $scope.showFailureAlert();
   
 });

     }

       $http.get(properties.customer_path+"/"+ $scope.getid.id).then(function successCallback(response) {
  
  
     $scope.Profile= response.data;
  
  }, 
  function errorCallback(response) {
   
  //  $scope.showFailureAlert();
   
 });

    
   

 
  }

  
}

