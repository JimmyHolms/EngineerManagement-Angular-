'use strict';
const angular = require('angular');

import { ReadableAddress, setCorrectImagePath } from '../../../Utility/Utility';
import * as properties from '../../../properties';

export default class EditcustomerComponent {
  /*@ngInject*/
  constructor($http, $routeParams, $scope) {
    this.$http = $http;
    this.$scope = $scope;
    this.currentAddress = null;
    this.currentCard = null;
    $scope.customer_imagefile = null;
    var customer_id = $routeParams.customer_id.split("=")[1];
    $(".alert").hide();   //Hides all the BS alerts on the page
    $(".scroll-to-top").click();

    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
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

    this.showAddressValidationAlert = function () {
      $("#validation-address-alert").fadeTo(3000, 500).slideUp(500, function () { $("#validation-address-alert").slideUp(500); });
    }

    this.showCardValidationAlert = function () {
      $("#validation-card-alert").fadeTo(3000, 500).slideUp(500, function () { $("#validation-card-alert").slideUp(500); });
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
      $scope.customer_imagefile = this.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#customer_photo').attr('src', reader.result);
      }
      reader.readAsDataURL($scope.customer_imagefile);
    });
    this.onInit(customer_id);
  }
  onInit(customer_id) {
    this.$http.get(properties.customer_path + "/" + customer_id).then(response => {
      this.customer = response.data;
      if (angular.isUndefined(this.customer.image_path)) {
        $('#customer_photo').attr('src', "/assets/images/avatar.jpg");
      } else {
        this.customer.image_path = setCorrectImagePath(this.customer.image_path);
        $('#customer_photo').attr('src', this.customer.image_path);
      }

    }, error => {
    });
  }
  uploadImage() {
    var customer_id = this.customer.user_id;
    if (this.$scope.customer_imagefile == null) {
      this.showSuccessAlert();
      return;
    }
    var imageFormData = new FormData();
    imageFormData.append("upload_image", this.$scope.customer_imagefile);
    this.$http.post(properties.upload_customer_profile + "/" + customer_id, imageFormData, {
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
  addAddress() {
    if (!this.validateAddress()) {
      this.showAddressValidationAlert();
      return;
    }

    if (this.customer == null) this.customer = {};
    if (angular.isUndefined(this.customer.addresses)) this.customer.addresses = [];
    this.customer.addresses.push(this.currentAddress);
    this.currentAddress = null;
  }

  removeAddress(address) {
    var index = this.customer.addresses.indexOf(address);
    if (index != -1)
      this.customer.addresses.splice(index, 1);
  }

  getReadableAddress(address) {
    return ReadableAddress(address);
  }

  addCard() {
    if (!this.validateCard()) {
      this.showCardValidationAlert();
      return;
    }

    if (this.customer == null) this.customer = {};
    if (angular.isUndefined(this.customer.payment_info)) this.customer.payment_info = [];
    this.customer.payment_info.push(this.currentCard);
    this.currentCard = null;
  }

  removeCard(card) {
    var index = this.customer.payment_info.indexOf(card);
    if (index != -1)
      this.customer.payment_info.splice(index, 1);
  }
  forgotPassword() {
    this.$http.post(properties.forgot_customer_password, { "email": this.customer.email }).then(response => {
      if (response.status == 200) {
        this.showForgotPasswordSuccessAlert();
      } else {
        this.showForgotPasswordFailureAlert();
      }
    }, error => {
      this.showForgotPasswordFailureAlert();
    });
  }
  Update() {
    if (!this.validate()) {
      this.showValidationAlert();
      return;
    }
    this.post_customer = {};
    this.post_customer.full_name = this.customer.full_name;
    this.post_customer.mobile_number = this.customer.mobile_number;
    this.post_customer.company_name = this.customer.company_name;
    this.post_customer.designation = this.customer.designation;
    this.post_customer.addresses = this.customer.addresses;
    this.post_customer.payment_info = this.customer.payment_info;
    var config = 'contenttype';
    // Posting Customer
    this.$http.put(properties.customer_path + "/" + this.customer.user_id, this.post_customer, config)
      .then(response => {
        if (response.status == 200) {
          this.uploadImage();
        } else {
          this.showFailureAlert();
        }
        this.currentAddress = null;
        this.currentCard = null;
      },
      error => {
        //this.errorResponse = error.data;
        this.showFailureAlert();
      });
  }

  cancel() {
    this.onInit(this.customer.user_id);
    setTimeout(function () {
      $("#cancel-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cancel-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }, 1000);
    this.currentAddress = null;
    this.currentCard = null;
  }

  validateAddress() {
    var result = true;

    if (this.currentAddress == null) {
      this.highlightSubField($("#site_name"));
      result = false;
    }
    else if (angular.isUndefined(this.currentAddress.site_name) || this.currentAddress.site_name == '') {
      this.highlightSubField($("#site_name"));
      result = false;
    }
    else this.unhighlightSubField($("#site_name"));

    return result;
  }

  validateCard() {
    var result = true;

    if (this.currentCard == null) {
      this.highlightSubField($("#name_card"));
      result = false;
    }
    else if (angular.isUndefined(this.currentCard.name_card) || this.currentCard.name_card == '') {
      this.highlightSubField($("#name_card"));
      result = false;
    }
    else this.unhighlightSubField($("#name_card"));

    return result;
  }

  validate() {
    var result = true;

    if (this.customer == null) {
      this.highlight($("#full_name"));
      this.highlight($("#email"));
      this.highlight($("#password"));
      this.highlight($("#confirmPassword"));
      $("#addresses").addClass("text-danger");
      return false;
    }

    if (this.customer.full_name == null || this.customer.full_name == '') {
      this.highlight($("#full_name"));
      result = false;
    }
    else this.unhighlight($("#full_name"));

    if (this.customer.email == null || this.customer.email == '') {
      this.highlight($("#email"));
      result = false;
    }
    else this.unhighlight($("#email"));

    if (this.customer.addresses == null || this.customer.addresses.length == 0) {
      $("#addresses").addClass("text-danger");
      result = false;
    }
    else $("#addresses").removeClass("text-danger");

    return result;
  }

  highlightSubField(field) {
    field.closest("#required").addClass("has-error");
  }

  unhighlightSubField(field) {
    field.closest("#required").removeClass("has-error");
  }

  highlight(field) {
    field.closest(".form-group").addClass("has-error");
  }

  unhighlight(field) {
    field.closest(".form-group").removeClass("has-error");
  }
}