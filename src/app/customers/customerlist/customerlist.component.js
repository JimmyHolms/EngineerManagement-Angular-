'use strict';
const angular = require('angular');

import * as properties from '../../../properties';
import { ReadableAddress, setCorrectPhotoPath } from '../../../Utility/Utility';
export default class CustomerListComponent {
  /*@ngInject*/
  constructor($http, $scope, $location, $confirm, socket, $uibModal, $resource, DTOptionsBuilder, DTColumnDefBuilder) {

    this.$scope = $scope;
    this.$http = $http;
    this.socket = socket;
    this.$uibModal = $uibModal;
    this.$location = $location;
    this.animationsEnabled = true;
    this.cust_message = "";
    this.activestatus = ["Active", "Inactive"];
    $(".alert").hide();
    $(".scroll-to-top").click();
    this.onInit();
    this.dtOptions = DTOptionsBuilder.fromSource(this.customers)
      .withPaginationType('full_numbers');
    this.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0),
      DTColumnDefBuilder.newColumnDef(1),
      DTColumnDefBuilder.newColumnDef(2),
      DTColumnDefBuilder.newColumnDef(3),
      DTColumnDefBuilder.newColumnDef(4).notSortable()
    ];
    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('customer');
    });
    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.changestatus = function (customer) {
      var cust = customer;
      var me = this;
      var question_title = "";
      var top_title = "";
      var is_active = false;
      if (customer.activestatus == this.activestatus[0]) {
        is_active = true;
        question_title = "Are you sure you want to active?";
        top_title = "Active Customer" + "(" + customer.full_name + ")";
      } else {
        question_title = "Are you sure you want to inactive?";
        top_title = "Inactive Customer" + " (" + customer.full_name + ")";
      }
      $confirm({ text: question_title, title: top_title, ok: 'Yes', cancel: 'No' })
        .then(function () {
          $http.put(properties.customer_path + "/" + cust.user_id, { "is_active": is_active })
            .then(response => {
              if (response.status == 204 || response.status==200) {
                if (is_active == true) {
                  me.cust_message = "Customer  " + cust.full_name + " successfully actived!";
                } else {
                  me.cust_message = "Customer  " + cust.full_name + " successfully inactived!";
                }
                me.showSuccessAlert();
                me.onInit();
              } else {
                if (is_active == true) {
                  me.cust_message = "Customer  " + cust.full_name + " activation failed!";
                } else {
                  me.cust_message = "Customer  " + cust.full_name + " inactivation failed!";
                }
                me.showFailureAlert();
              }
            });
        });
    }
  }

  onInit() {
    this.$http.get(properties.approvedcustomer_path)
      .then(response => {
        this.customers = response.data;
        this.customers.sort(function (a, b) { return a.created_datetime < b.created_datetime; });
        this.socket.syncUpdates('customer', this.customers);
      });
  }
  populateCustomers() {
    var len=0;
    if(angular.isArray(this.customers))
    {
      len = this.customers.length;
    }
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        var is_active = this.customers[i].is_active;
        if (is_active) {
          this.customers[i].activestatus = this.activestatus[0];
        } else {
          this.customers[i].activestatus = this.activestatus[1];
        }
      }
    }
  }

  setCurrentCustomer(customer) {
    this.current_customer = customer;
    this.current_customer.addressdetail = ReadableAddress(customer.addresses[0]);
    this.openComponentModal();
  }
  setEditCustomer(user_id) {
    this.$location.path("/editcustomer/customer_id=" + user_id);
  }
  setCorrectImagePath() {
    if (angular.isUndefined(this.current_customer.image_path)) {
      return "/assets/images/avatar.jpg";
    } else {
      return setCorrectPhotoPath(this.current_customer.image_path);
    }
  }
  openComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('../showcustomer/customerinformation.html'),
      scope: this.$scope,
      size: 'lg'
    });
    this.$scope.modalInstance = modalInstance;
    return modalInstance.result;
  }
  ok() {
    this.$scope.modalInstance.close();
  }
  cancel() {
    this.$scope.modalInstance.dismiss();
  }
  setCurrentStatus() {
    var active = this.current_customer.is_active;
    if (active) {
      return this.activestatus[0];
    }
    return this.activestatus[1];
  }
}


