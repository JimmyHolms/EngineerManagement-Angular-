'use strict';
const angular = require('angular');

import * as properties from '../../../properties';
import { ReadableAddress } from '../../../Utility/Utility';

export default class EdituserComponent {
  /*@ngInject*/
  constructor($http, $filter, $scope, $routeParams) {
    this.$http = $http;
    this.$scope = $scope;
    this.$filter = $filter;
    this.submitted = false;
    $scope.image_file = null;
    var user_id = $routeParams.user_id.split("=")[1];
    $(".alert").hide();
    $(".scroll-to-top").click();
    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showWrongUserId = function () {
      $("#wrong-userid").fadeTo(3000, 500).slideUp(500, function () { $("#wrong-userid").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showCancelAlert = function () {
      $("#cancel-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cancel-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showImageUploadFailureAlert = function () {
      $("#failure-image-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-image-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showForgotPasswordSuccessAlert = function () {
      $("#success-forgotpassword-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-forgotpassword-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showForgotPasswordFailureAlert = function () {
      $("#failed-forgotpassword-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failed-forgotpassword-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    $("#photo_input").change(function () {
      $scope.image_file = this.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#user_photo').attr('src', reader.result);
      }
      reader.readAsDataURL($scope.image_file);
    });
    this.cancel = function () {
      this.onInit(user_id);
      setTimeout(function () {
        $("#cancel-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cancel-alert").slideUp(500); });
        $(".scroll-to-top").click();
      }, 500);
    }
    this.userTypes = [{ name: "Operator", value: "user" }, { name: "Administrator", value: "admin" }];
    this.onInit(user_id);
  }
  onInit(user_id) {
    this.$http.get(properties.operator_path + "/" + user_id).then(response => {
      this.user = response.data;
      this.selectedUserType = this.$filter('filter')(this.userTypes, { value: this.user.role }, true)[0];
      this.user.image_path = properties.baseUrl + "/" + this.user.image_path;
      $("#user_photo").attr("src", this.user.image_path);
      return true;
    });
    return false;
  }
  forgotPassword() {
    this.$http.post(properties.forgot_user_password, { "email": this.user.email }).then(response => {
      if(response.status==200){
        this.showForgotPasswordSuccessAlert();
      }else{
        this.showForgotPasswordFailureAlert();
      }
    },error=>{
      this.showForgotPasswordFailureAlert();
    });
  }
  uploadImage() {
    if (this.$scope.image_file == null) {
      this.showSuccessAlert();
      return;
    }
    var imageFormData = new FormData();
    imageFormData.append("upload_image", this.$scope.image_file);
    this.$http.post(properties.upload_operator_profile + "/" + this.user.user_id, imageFormData, {
      transformRequest: angular.identity,
      headers: {
        'Content-Type': undefined
      }
    }).then(response => {
      if (response.status == 201) {
        this.showSuccessAlert();
      } else {
        this.showImageUploadFailureAlert();
      }
    });
  }
  update(form) {
    this.submitted = true;
    if (form.$valid) {
      this.update_user = {};
      this.update_user.full_name = this.user.full_name;
      this.update_user.mobile_number = this.user.mobile_number;
      this.update_user.role = this.selectedUserType.value;
      this.update_user.address = {
        "site_name": this.user.address.site_name,
        "street_address": this.user.address.street_address,
        "city": this.user.address.city,
        "state": this.user.address.state,
        "country": this.user.address.country,
        "zip_code": this.user.address.zip_code,
        "phone_number": this.user.address.phone_number,
        "location": this.user.address.location
      };
      var config = 'contenttype';
      this.$http.put(properties.operator_path + "/" + this.user.user_id, this.update_user, config)
        .then(response => {
          if (response.status == 200) {
            this.uploadImage();
          } else if (response.status == 404) {
            this.showWrongUserId();
          } else {
            this.showFailureAlert();
          }

        }, error => {
          this.showFailureAlert();
        });
      this.submitted = false;
    }

  }

}
