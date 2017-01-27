'use strict';
const angular = require('angular');
const ngRoute = require('angular-route');


import routes from './customerjobhistory.routes';
import * as properties from '../../../properties';
import custom_carousel from '../../../components/carousel/carousel.component';


export class customerjobhistoryComponent {
  /*@ngInject*/
  constructor($http, $location, $scope, socket, $uibModal, $document,Auth) {

    this.$scope = $scope;
    this.$http = $http;
    this.socket = socket;
    this.$uibModal = $uibModal;
    this.$document = $document;
    this.$location = $location;
    this.animationsEnabled = true;
      this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.getCurrentUser = Auth.getCurrentUserSync;
     $scope.Profile = Auth.getCurrentUserSync();
       
   
    $(".scroll-to-top").click();

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('job');
      socket.unsyncUpdates('engineer');
    });

  }

  $onInit() {
    this.$http.get(properties.job_path)
      .then(response => {
        this.atlasJobs = response.data;     
      
        this.atlasJobs.sort(function (a, b) { return a.created_datetime < b.created_datetime; });
        this.socket.syncUpdates('job', this.atlasJobs);
      });

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

  setCurrentJobedit(job) {
  
     this.$location.path('/editjob/jid='+job.job_id);
    //this.current_job = job;
    //this.openComponentModalEdit();
  }
  ok()
  {
    this.$scope.modalInstance.close();
  }
  cancel()
  {
    this.$scope.modalInstance.dismiss();
  }
  isCustomerEquipmentExist()
  {
    if(angular.isUndefined(this.current_job.customer_equipment))
    {
      return false;
    }
    return true;
  }
  changeEngineer(job) {
    this.$http.put(properties.engineer_path + "/" + job.job_id, {
      engineers: [{
        mobile_number: job.selectedEngineer.mobile_number,
        email: job.selectedEngineer.email,
        company_name: job.selectedEngineer.company_name,
        full_name: job.selectedEngineer.full_name,
        user_id: job.selectedEngineer.user_id
      }]
    });
  }

  populateEngineers() {
    var obj,len;
    if(!angular.isArray(this.atlasEngineers))
    {
      return;
    }
    len = this.atlasEngineers.length;
    for (var i = 0; i < len; i++) {
      obj = null;

      for (var j = 0, len1 = this.atlasEngineers.length; j < len1; j++) {
        if (this.atlasJobs[i].engineers[0] != null && this.atlasJobs[i].engineers[0].user_id == this.atlasEngineers[j].user_id) {
          obj = this.atlasEngineers[j];
          break;
        }
      }

      this.atlasJobs[i].selectedEngineer = obj;
    }
  }
  openComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('../../jobs/showjob/jobinformationcustomer.html'),
      scope: this.$scope,
      size: 'lg'
    });
    this.$scope.modalInstance = modalInstance;
   
    return modalInstance.result;
  }


  //openComponentModalEdit() {
   // var modalInstance = this.$uibModal.open({
    //  animation: this.animationsEnabled,
     // template: require('../../jobs/showjob/jobinformationcustomeredit.html'),
    //  scope: this.$scope,
    //  size: 'lg'
  //  });
  //  this.$scope.modalInstance = modalInstance;
   
  //  return modalInstance.result;
  //}

}




// Please note that the close and dismiss bindings are from $uibModalInstance.


export default angular.module('applogix.customerjobhistory', [ngRoute,custom_carousel])
  .config(routes)
  .component('customerjobhistory', {
    template: require('./customerjobhistory.html'),
    controller: customerjobhistoryComponent,
    controllerAs: 'customerjobhistoryCtrl'
  })
  .name;
