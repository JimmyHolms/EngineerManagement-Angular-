'use strict';
const angular = require('angular');

import * as properties from '../../../properties';
import { ReadableAddress, setCorrectPhotoPath } from '../../../Utility/Utility';
export default class UserlistComponent {
  /*@ngInject*/
  constructor($http, $scope, $location, socket, $confirm, $uibModal, $resource, DTOptionsBuilder, DTColumnDefBuilder) {

    this.$scope = $scope;
    this.$http = $http;
    this.socket = socket;
    this.$uibModal = $uibModal;
    this.$location = $location;
    this.animationsEnabled = true;
    this.user_message = "";
    this.activestatus = ["Active", "Inactive"];
    $(".alert").hide();
    $(".scroll-to-top").click();
    this.onInit();
    this.dtOptions = DTOptionsBuilder.fromSource(this.enginners)
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
    this.changestatus = function (user) {
      var current_user = user;
      var me = this;
      var question_title = "";
      var top_title = "";
      var is_active = false;
      if (user.activestatus == this.activestatus[0]) {
        is_active = true;
        question_title = "Are you sure you want to active?";
        top_title = "Active user" + "(" + user.full_name + ")";
      } else {
        question_title = "Are you sure you want to inactive?";
        top_title = "Inactive user" + " (" + user.full_name + ")";
      }
      $confirm({ text: question_title, title: top_title, ok: 'Yes', cancel: 'No' })
        .then(function () {
          $http.put(properties.operator_path + "/" + current_user.user_id, { "is_active": is_active })
            .then(response => {
              if (response.status == 204 || response.status == 200) {
                if (is_active == true) {
                  me.user_message = "User  " + current_user.full_name + " successfully actived!";
                } else {
                  me.user_message = "User  " + current_user.full_name + " successfully inactived!";
                }
                me.showSuccessAlert();
                me.onInit();
              } else {
                if (is_active == true) {
                  me.user_message = "User  " + current_user.full_name + " activation failed!";
                } else {
                  me.user_message = "User  " + current_user.full_name + " inactivation failed!";
                }
                me.showFailureAlert();
              }
            });
        });
    }
    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('operator');
    });
  }
  setCorrectImagePath(path) {
    return setCorrectPhotoPath(this.current_user.image_path);
  }
  onInit() {
    this.$http.get(properties.operator_path)
      .then(response => {
        this.users = response.data;
        this.users.sort(function (a, b) { return a.created_datetime < b.created_datetime; });
        this.socket.syncUpdates('operator', this.users);
      });
  }
  editUser(user_id) {
    this.$location.path('/edituser/user_id=' + user_id);
  }
  showRole(user) {
    var profile = user.profile;
    if (profile.role == "admin") {
      return "Administrator";
    }
    return "Operator";
  }
  populateUsers() {
    var len = this.users.length;
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        var is_active = this.users[i].is_active;
        if (is_active) {
          this.users[i].activestatus = this.activestatus[0];
        } else {
          this.users[i].activestatus = this.activestatus[1];
        }
      }
    }
  }
  setCurrentUser(user) {
    this.current_user = user;
    this.current_user.address_detail = ReadableAddress(user.address);
    this.openComponentModal();
  }
  openComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('../showuser/userinformation.html'),
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
    var active = this.current_user.is_active;
    if (active) {
      return this.activestatus[0];
    }
    return this.activestatus[1];
  }

}


