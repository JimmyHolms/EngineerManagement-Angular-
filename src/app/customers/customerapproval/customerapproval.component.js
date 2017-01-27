'use strict';
const angular = require('angular');

import * as properties from '../../../properties';
import { ReadableAddress } from '../../../Utility/Utility';
export default class CustomerApprovalComponent {
  /*@ngInject*/
  constructor($http, $scope, socket, $confirm, $location, $uibModal, $resource, DTOptionsBuilder, DTColumnDefBuilder) {

    this.$scope = $scope;
    this.$http = $http;
    this.socket = socket;
    this.$uibModal = $uibModal;
    this.$location = $location;
    this.animationsEnabled = true;
    this.appro_customer = "";
    this.actionstatus = ["Unapproved", "Approved"];
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
    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.changestatus = function (customer, index) {
      var cust = customer;
      var text = 'Approve Customer' + "  (" + customer.full_name + ")";
      var customers = this.customers;
      var me = this;
      customer.actionstatus = this.actionstatus[0];
      $confirm({ text: 'Are you sure you want to approve?', title: text, ok: 'Yes', cancel: 'No' })
        .then(function () {
          $http.put(properties.approvecustomer_path + "/" + cust.user_id, { "is_approved": true })
            .then(response => {
              me.appro_customer = customer.full_name;
              if (response.status == 204) {
                customers.splice(index, 1);
                me.showSuccessAlert();
              } else {
                customer.actionstatus = me.actionstatus[0];
                me.showFailureAlert();
              }
            });
        });
    }
    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('unapproved_customer');
    });
  }

  onInit() {
    this.$http.get(properties.unapprovedcustomer_path)
      .then(response => {
        this.customers = response.data;
        this.customers.sort(function (a, b) { return a.created_datetime < b.created_datetime; });
        this.socket.syncUpdates('unapproved_customer', this.customers);
        this.populateCustomers();
      });
  }
  setEditCustomer(user_id) {
    this.$location.path("/editcustomer/customer_id=" + user_id);
  }
  setCurrentCustomer(customer) {
    this.current_customer = customer;
    this.current_customer.addressdetail = ReadableAddress(customer.addresses[0]);
    this.openComponentModal();
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
  populateCustomers() {
    var len = this.customers.length;
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        this.customers[i].actionstatus = this.actionstatus[0];
      }
    }
  }
    setCorrectImagePath() {
    if (angular.isUndefined(this.current_customer.image_path)) {
      return "/assets/images/avatar.jpg";
    } else {
      return setCorrectPhotoPath(this.current_customer.image_path);
    }
  }
}


