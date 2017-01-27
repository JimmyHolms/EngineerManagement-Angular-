'use strict';
const angular = require('angular');

import * as properties from '../../../properties';
import { ReadableAddress, setCorrectPhotoPath } from '../../../Utility/Utility';
export default class EngineerApprovalComponent {
  /*@ngInject*/
  constructor($http, $scope, $location, socket, $confirm, $uibModal, $resource, DTOptionsBuilder, DTColumnDefBuilder) {

    this.$scope = $scope;
    this.$http = $http;
    this.$location = $location;
    this.socket = socket;
    this.$uibModal = $uibModal;
    this.animationsEnabled = true;
    this.appro_engineer = "";
    this.actionstatus = ["Unapproved", "Approved"];
    this.activestatus = ["Active", "Inactive"];
    $(".alert").hide();
    $(".scroll-to-top").click();
    this.onInit();

    this.dtOptions = DTOptionsBuilder.fromSource(this.engineers)
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
    this.changestatus = function (engineer, index) {
      var me = this;
      var cust = engineer;
      var text = 'Approve engineer' + "  (" + engineer.full_name + ")";
      var engineers = this.engineers;
      engineer.actionstatus = this.actionstatus[0];
      $confirm({ text: 'Are you sure you want to approve?', title: text, ok: 'Yes', cancel: 'No' })
        .then(function () {
          $http.put(properties.approveengineer_path + "/" + cust.user_id, { "is_approved": true })
            .then(response => {
              if (response.status == 204) {
                engineers.splice(index, 1);
                me.appro_engineer = engineer.full_name;
                me.showSuccessAlert();
              } else {
                engineer.actionstatus = me.actionstatus[0];
                me.appro_engineer = engineer.full_name;
                me.showFailureAlert();
              }
            });
        });
     
      
    }
    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('unapproved_engineer');
    });
  }

  onInit() {
    this.$http.get(properties.unapprovedengineer_path)
      .then(response => {
        this.engineers = response.data;
        this.engineers.sort(function (a, b) { return a.created_datetime < b.created_datetime; });
        this.socket.syncUpdates('unapproved_engineer', this.engineers);
        this.populateengineers();
      });
  }
  setEditEngineer(engineer) {
    this.$location.path("/editengineer/eng_id=" + engineer.user_id);
  }
  setCorrectCertificatePath(src) {
    return setCorrectPhotoPath(src);
  }
  setCurrentengineer(engineer) {
    this.current_engineer = engineer;
    this.current_engineer.average_rating = 5;
    //this.current_engineer.addressdetail = ReadableAddress(engineer.addresses[0]);
    this.openComponentModal();
  }
  openComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('../showengineer/engineerinformation.html'),
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
  setCorrectImagePath() {
    if (angular.isUndefined(this.current_engineer.image_path)) {
      return "/assets/images/avatar.jpg";
    } else {
      return setCorrectPhotoPath(this.current_engineer.image_path);
    }
  }
  setCurrentStatus() {
    var active = this.current_engineer.is_active;
    if (active) {
      return this.activestatus[0];
    }
    return this.activestatus[1];
  }
  populateengineers() {
    var len = this.engineers.length;
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        this.engineers[i].actionstatus = this.actionstatus[0];
      }
    }
  }
}


