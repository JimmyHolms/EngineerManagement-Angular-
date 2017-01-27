'use strict';
import * as properties from '../../../properties';
export default class customerforgotpasswordController {

  /*@ngInject*/
  constructor(Auth, $scope, $location, $http) {
    this.Auth = Auth;
    this.$http = $http;
    this.$location = $location;
    $scope.tempObject = { email: '' };
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


    $scope.forgotpass = function () {

      if ($scope.tempObject.email == "")
      { }
      else {
        var config = {
          headers: {
            'Content-Type': 'application/json'

          }
        }

        $http.post(properties.customerforgot_path, $scope.tempObject, config).then(function successCallback(response) {

          $scope.showSuccessAlert();
        },
          function errorCallback(response) {

            $scope.showFailureAlert();

          });

      }

    }


  }

}
