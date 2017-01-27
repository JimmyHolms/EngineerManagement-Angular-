'use strict';
const angular = require('angular');

import * as properties from '../../../properties';
import { ReadableAddress, makeImageMultiFormData } from '../../../Utility/Utility';

export default class AdduserComponent {
  /*@ngInject*/
  constructor($http, $scope) {
    this.$http = $http;
    this.submitted = false;
    this.$scope = $scope;
    this.user = {};
    this.errors = {};
    this.user.address = {};
    $scope.imageArray = null;
    $(".alert").hide();
    $(".scroll-to-top").click();
    this.userTypes = [{ name: "Operator", value: "user" }, { name: "Administrator", value: "admin" }];
    this.selectedUserType = this.userTypes[0];

    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.showFailureAlert = function () {
      var result = this.getUserAdditionErrors();
      $('#error-list').html(result).contents();
      $(".failure-addition-user").fadeTo(3000, 500).slideUp(500, function () { $(".failure-addition-user").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showImageUploadFailureAlert = function(){
      $("#failure-image-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-image-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showCancelAlert = function () {
      $("#cancel-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cancel-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showValidationAlert = function () {
      $("#validation-alert").fadeTo(3000, 500).slideUp(500, function () { $("#validation-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    
    $("#photo_input").change(function () {
      $scope.file = this.files[0];
      //var file = this.files[0];
      //$scope.imageArray = [];
      var reader = new FileReader();
      reader.onload = function (e) {

        $('#user_photo').attr('src',reader.result);
      }
      reader.readAsDataURL($scope.file);
      // reader.onload = function(){
      //   var imgContent = {};
      //   imgContent.filename = file.name;
      //   imgContent.size = file.size;
      //   imgContent.contentType = file.type;
      //   imgContent.lastModifiedDate = file.lastModifiedDate;
      //   imgContent.fileContent = unescape(encodeURIComponent(this.result));
      //   alert(imgContent.fileContent);
      //   $scope.imageArray.push(imgContent);
      // }
      // reader.readAsBinaryString(file);
    });
    // $scope.getDecodedString = function (content) {
    //   if (content.includes("base64")) {
    //     var index = content.indexOf("base64");
    //     var realcontent = content.substring(index + 7);
    //     var decodedcontent = window.atob(realcontent);
    //     return decodedcontent;
    //   }
    //   return content;
    // }
    // this.setImage = function () {
    //   $scope.fileArray = [];
    //   $scope.file = this.flow.files[0].file;
    //   var fileReader = new FileReader();
    //   fileReader.onloadend = function (evt) {
    //     var uri = event.target.result;
    //     var imgContent = {};
    //     imgContent.fileContent = uri;
    //     imgContent.contentType = $scope.file.type;
    //     imgContent.size = $scope.file.size;
    //     imgContent.filename = $scope.file.name;
    //     imgContent.lastModifiedDate = $scope.file.lastModifiedDate;
    //     $scope.fileArray.push(imgContent);
    //   };
    //   fileReader.readAsDataURL($scope.file);
    // }
  }

  add(form) {
    this.submitted = true;
    var isFileEmpty = true;
    var imageFormData = new FormData();
    imageFormData.append("upload_image", this.$scope.file);
    if ((!angular.isUndefined(this.$scope.file)) || (this.$scope.file!=null)) {
      isFileEmpty = false;
    }
    //var imageArrayData = this.$scope.imageArray;
    //var imageFormData = makeImageMultiFormData(imageArrayData);
    if (form.$valid) {
      this.user.role = this.selectedUserType.value;
      this.user.site_name = "personal";
      this.user.address.location = {
        "longitude": 24.63765,
        "latitude": -1.45824
      };
      this.$http.post(properties.operator_path, this.user)
        .then(response => {
          if (response.status == 201) {
            var id = response.data.user_id;
            if (isFileEmpty) {
              this.showSuccessAlert();      
            } else {
              this.$http.post(properties.upload_operator_profile + "/" + id, imageFormData, {
                transformRequest: angular.identity,
                headers: {
                  //'Content-Type': 'multipart/form-data;charset=utf-8;boundary=' + properties.boundary
                  'Content-Type': undefined
                }
              }).then(response => {
                if (response.status == 201) {
                  this.showSuccessAlert();
                  this.$scope.file=null;
                  $('#user_photo').attr('src',"/assets/images/avatar.jpg");
                }else{
                  this.showImageUploadFailureAlert();
                }
              });
            }
            this.selectedUserType = this.userTypes[0];
            this.user = {};
            this.user.address = {};
            this.confirmPassword ="";
          } else {
            this.showFailureAlert();
          }

        }, error => {
          this.errors = error.data.errors;
          this.showFailureAlert();
        });
      this.submitted = false;
    }else{
      this.showValidationAlert();
    }

  }
  getUserAdditionErrors() {
    var result = "";
    angular.forEach(this.errors, function(value, key) {
      result+=  '<div class="alert alert-danger failure-addition-user" ><strong>User Addition Failure!  </strong>' + value.message + "</div>";
    });
    return result;
  }
}
