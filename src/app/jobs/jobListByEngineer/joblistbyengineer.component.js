'use strict';
const angular = require('angular');
import * as properties from '../../../properties';

export default class JobListByEngineerComponent {
  /*@ngInject*/
  constructor($http, $location, $scope, socket, $uibModal, $document) {
    this.$scope = $scope;
    this.$http = $http;
    this.socket = socket;
    this.$uibModal = $uibModal;
    this.$document = $document;
    this.$location = $location;
    this.animationsEnabled = true;
    $(".scroll-to-top").click();

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('job');
      socket.unsyncUpdates('engineer');
    });
    this.onInit();
  }
  onInit() {
    this.$http.get(properties.engineer_path)
      .then(response => {
        this.atlasEngineers = response.data;
        this.socket.syncUpdates('engineer', this.atlasEngineers);
      });
  }

  setCurrentJob(job) {
    this.current_job = job;
    this.openComponentModal();
  }
  setEditJob(job) {
    this.$location.path('/editjob/jid=' + job.job_id);
  }
  ok() {
    this.$scope.modalInstance.close();
  }
  cancel() {
    this.$scope.modalInstance.dismiss();
  }
  isCustomerEquipmentExist() {
    if (angular.isUndefined(this.current_job.customer_equipment)) {
      return false;
    }
    return true;
  }
  changeEngineer() {
    var user_id = this.selectedEngineer.user_id;
    this.$http.get(properties.customer_jobhistory + "/" + user_id).then(response => {
      this.atlasJobs = response.data;
      this.atlasJobs.sort(function (a, b) { return a.created_datetime < b.created_datetime; });
      this.socket.syncUpdates('job', this.atlasJobs);
    });
  }

  openComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('../showjob/jobinformation.html'),
      scope: this.$scope,
      size: 'lg'
    });
    this.$scope.modalInstance = modalInstance;
    return modalInstance.result;
  }
}

