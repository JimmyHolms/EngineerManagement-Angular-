'use strict';
const angular = require('angular');

import { ReadableAddress } from '../../../Utility/Utility';
import * as properties from '../../../properties';

export default class AddcustomerComponent {
  /*@ngInject*/
  constructor($http, $scope) {
    this.$http = $http;
    this.$scope = $scope;
    this.customer = null;
    this.confirmPassword = null;
    this.currentAddress = null;
    this.currentCard = null;
    this.errors = {};
    $scope.customer_imagefile = null;
    $(".alert").hide();   //Hides all the BS alerts on the page
    $(".scroll-to-top").click();

    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.showFailureAlert = function () {
      var result = this.getCustomerAdditionErrors();
      $('#error-list').html(result).contents();
      $(".failure-addition-customer").fadeTo(3000, 500).slideUp(500, function () { $(".failure-addition-customer").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.showCancelAlert = function () {
      $("#cancel-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cancel-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    $scope.ConflictFailureAlert = function () {
      $("#Conflictfailure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#Conflictfailure-alert").slideUp(500); });
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
    this.showImageUploadFailureAlert = function(){
      $("#failure-image-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-image-alert").slideUp(500); });
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
  uploadImage(customer_id) {
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
  add() {
    var mss = this;
    if (!this.validate()) {
      this.showValidationAlert();
      return;
    }

    // Posting Customer
    this.$http.post(properties.customer_path, this.customer)
      .then(response => {
        if(response.status == 201)
        {
          this.uploadImage(response.data.user_id);  
        }else{
          this.showFailureAlert();
        }
        this.customer = null;
        this.confirmPassword = null;
        this.currentAddress = null;
        this.currentCard = null;
        $('#customer_photo').attr('src',"/assets/images/avatar.jpg");
      },
      error => {
           mss.$scope.ConflictFailureAlert();
        this.errors = error.data.errors;
        //this.errorResponse = error.data;
        this.showFailureAlert();
      });
  }

  cancel() {
    if (this.customer != null || this.confirmPassword != null || this.currentAddress != null || this.currentCard != null) this.showCancelAlert();
    this.customer = null;
    this.confirmPassword = null;
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

    if (this.customer.password == null || this.customer.password == '') {
      this.highlight($("#password"));
      result = false;
    }
    else this.unhighlight($("#password"));

    if (this.confirmPassword == null || this.confirmPassword == '' || this.confirmPassword != this.customer.password) {
      this.highlight($("#confirmPassword"));
      result = false;
    }
    else this.unhighlight($("#confirmPassword"));

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
  getCustomerAdditionErrors() {
    var result = "";
    angular.forEach(this.errors, function(value, key) {
      result+=  '<div class="alert alert-danger failure-addition-customer" ><strong>Customer Addition Failure!  </strong>' + value.message + "</div>";
    });
    return result;
  }
}