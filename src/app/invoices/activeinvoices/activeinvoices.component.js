'use strict';
import { ReadableAddress } from '../../../Utility/Utility';
import * as properties from '../../../properties';
export default class activeinvoicesComponent {
  /*@ngInject*/
  constructor($http, $scope, Auth, $uibModal, ) {
    this.$http = $http;
    this.$scope = $scope;
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.$uibModal = $uibModal;
    // this.$http.get(properties.invoice_Active).success(function (response) { 

    //   $scope.Profile = response;

    //  });
    this.$http.get(properties.invoice_Active)
      .then(response => {
     
        $scope.Profile = response.data;
      });


    $(".scroll-to-top").click();
  }

  setCurrentJob(job) {

    this.current_job = job;
    this.workitemsTotal = 0;
 

    for (var i = 0, len = job.work_items.length; i < len; i++) {
      this.workitemsTotal += job.work_items[i].cost;
    }

    this.openComponentModal();
  }
  openComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('./showjob/activeinformation.html'),
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
}

