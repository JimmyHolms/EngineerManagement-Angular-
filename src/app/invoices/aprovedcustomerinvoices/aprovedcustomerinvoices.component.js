'use strict';
import { ReadableAddress } from '../../../Utility/Utility';
import * as properties from '../../../properties';

export default class aprovedcustomerinvoicesComponent {
  /*@ngInject*/
  constructor($http, $scope, Auth, $confirm, $uibModal, $route, Notification) {
    this.$http = $http;
    this.$scope = $scope;
    this.$route = $route;
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
     $scope.GetUserInfo= Auth.getCurrentUserSync();
    this.$uibModal = $uibModal;
    this.editcurrent_job;
    this.current_workitem = {};
    this.actionstatus = ["Unapproved", "Approved"];
    $(".alert").hide();   //Hides all the BS alerts on the page
    $scope.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    $scope.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    $(".scroll-to-top").click();
    var vss = this;
    this.$http.get(properties.invoice_submitted +'/' +$scope.GetUserInfo.user_id)
      .then(response => {
        vss.Profile = response.data;
       
        vss.populateItems = response.data;

        vss.populateAproved();
      }); 

    this.changestatus = function (Job, index) {
      var jobid = Job;
      var text = 'Approve Invoice' + "  (" + Job.job_title + ")";
      var Profile = this.Profile;
     Job.actionstatus = this.actionstatus[0];
       var me = this;
       jobid.current_status = "Completed";
      $confirm({ text: 'Are you sure you want to approve?', title: text, ok: 'Yes', cancel: 'No' })
        .then(function () {
         
          $http.put(properties.job_path + "/" + jobid.job_id,jobid)
            .then(response => {

              if (response.status == 200) {
                //Profile.splice(index, 1);
               Job.actionstatus =  me.actionstatus[1];
               Job.status = 'Submitted';
                Notification.success({
                  title: "Approval Success",
                  message: "Job(" + jobid.job_title + ")" + " successfully approved!",
                  positionX: 'right',
                  positionY: 'top',
                  delay: 1500
                });
              } else {
                Job.actionstatus = "Unapproved";
                Notification.error({
                  title: "Approval Failed",
                  message: "Job(" + jobid.job_title + ")" + " approval  failed!",
                  positionX: 'right',
                  positionY: 'top',
                  delay: 1500
                });
              }
            });
        });
    }
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
      template: require('./Report/submittedinformation.html'),
      scope: this.$scope,
      size: 'lg'
    });
    this.$scope.modalInstance = modalInstance;

    return modalInstance.result;
  }
  
  ok() {
    this.$scope.modalInstance.close();
  }

  SaveEdit(current_job) {
    var vms = this;

    this.$http.put(properties.job_path + "/" + current_job.job_id, current_job).then(function successCallback(response) {

      vms.$scope.reloadPage();
      vms.ok();

    },
      function errorCallback(response) {

      });
  }
  cancel() {
    this.$scope.modalInstance.dismiss();
  }

  populateAproved() {

    var len = this.populateItems.length;

    if (len > 0) {
      for (var i = 0; i < len; i++) {
        if(this.Profile[i].current_status = 'Completed')
        {
           console.log( this.Profile[i].current_status);
     this.Profile[i].actionstatus = this.actionstatus[1];
        }       
      else
      { console.log('actionstatus');
       
       this.Profile[i].actionstatus = this.actionstatus[0];

      }
      }
    }
  }


}