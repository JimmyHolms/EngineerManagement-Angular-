'use strict';
const angular = require('angular');
import * as properties from '../../../properties';
export default class updatecustomerprofileComponent {
  /*@ngInject*/
  constructor($http, $scope,Auth) {
   this.$http = $http;
        
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.getCurrentUser = Auth.getCurrentUserSync;
  $(".alert").hide();   //Hides all the BS alerts on the page
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
  
    $scope.Image = 'http://'+ response.data.image_path;
     $scope.Profile= response.data;
  
  }, 
  function errorCallback(response) {
   
  //  $scope.showFailureAlert();
   
 });
 
   // $(".scroll-to-top").click();
      $scope.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
      $scope.CardUpdateAlert = function () {
      $("#CardUpdate-alert").fadeTo(3000, 500).slideUp(500, function () { $("#CardUpdate-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
      $scope.showUpdateAlert = function () {
      $("#Update-alert").fadeTo(3000, 500).slideUp(500, function () { $("#Update-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
 $scope.reloadPage = function(){window.location.reload();}
     $("#file").change(function () {
      $scope.customer_imagefile = this.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#customer_photo').attr('src', reader.result);
      }
      reader.readAsDataURL($scope.customer_imagefile);
    });
       $scope.CardFailureAlert = function () {
      $("#cardfailure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cardfailure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    } 
$scope.AddCard = function(){

   if($scope.paymentrow.cvc != '' && $scope.paymentrow.exp_year != '' && $scope.paymentrow.exp_month != '' && $scope.paymentrow.number != '')
  {
            var config = {headers:  {
             'Content-Type': 'application/json',
        'Authorization': 'Bearer  '+ Auth.getToken()
      
       
    }
   
};

 $http.post(properties.customerCreditCard_path,$scope.paymentrow,config).then(function successCallback(response) {
  
    $scope.CardUpdateAlert();
   
    
  }, 
  function errorCallback(response) {
   
  $scope.CardFailureAlert();
   
  });
}
else{

   $scope.showFailureAlert();
}
}
    
  $scope.form =  {
        site_name: '',
        street_address: '',
        city: '',
        state: '',
        country: '',
        zip_code: '',
        phone_number: ''

      };    

         
  $scope.paymentrow =  {   
  number: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
      };  
      
  $scope.i = 1;
   $scope.addRow = function() {
   
    $scope.array = [];
    for(var i = 0; i < $scope.i; i++) {
        $scope.array.push(i);
    }
}

// $scope.j = 1;
 //  $scope.addRowpayment = function() {
  
   // $scope.arraypayment = [];
   // for(var j = 0; j < $scope.j; j++) {
    //    $scope.arraypayment.push(j);
   // }
//}
    //console.log( Auth.getCurrentUserSync().full_name);
    var checkprofile = $scope.Profile.id;
    
     $(".alert").hide();  
       $scope.alertValues = function() {
    		alert(JSON.stringify($scope.form, null, 6));
    }


    
      $scope.updateProfile = function () {   
          
        
        if($scope.form.site_name == '')
        {     
        }
        else
        {        
           $scope.Profile.addresses.push($scope.form);         
        }

      
      // if($scope.paymentrow.last_digits == '')
      //  {          
      //  }
       // else
       // {        
        //   $scope.Profile.payment_info.push($scope.paymentrow);         
       // }        
   
        $scope.tempObject={full_name:$scope.Profile.full_name,
        mobile_number:$scope.Profile.mobile_number,
        company_name:$scope.Profile.company_name,
        designation: $scope.Profile.designation,    
        addresses: $scope.Profile.addresses
       // payment_info: $scope.Profile.payment_info
  
       };  
       
         var config = {headers:  {
             'Content-Type': 'application/json',
        'Authorization': 'Bearer  '+ Auth.getToken()
      
       
    }
   
};


      $http.put(properties.customerupdate_path + "/"+checkprofile,$scope.tempObject).then(function successCallback(response) {
  
    $scope.showUpdateAlert();
  }, 
  function errorCallback(response) {
   
  
   
  });
   }

 $scope.showimage ={
image_path : ''

 };
  $("form#data").submit(function(){

    var formData = new FormData($(this)[0]);

    $.ajax({
        url:properties.customerUploadImage_path + "/"+$scope.Profile.id,
        type: 'POST',
        data: formData,
        async: false,
        success: function (response) {         
    
            $scope.showimage.image_path= response.image_path;          
            $scope.showSuccessAlert();
        },
        cache: false,
        contentType: false,
        processData: false
    });

    return false;
});

      
     $scope.removeAddress = function(address) {
     
    var index = $scope.Profile.addresses.indexOf(address);
    // console.log($scope.Profile.addresses);
    if (index != -1)
     $scope.Profile.addresses.splice(index, 1);
       //console.log($scope.Profile.addresses);
  };


  $scope.removePayment = function(paymentarr) {
     
    var index = $scope.Profile.payment_info.indexOf(paymentarr);
     //console.log($scope.Profile.payment_info);
    if (index != -1)
     $scope.Profile.payment_info.splice(index, 1);
      // console.log($scope.Profile.payment_info);
  };
  //  $(".scroll-to-top").click();


    
  }

  
}

