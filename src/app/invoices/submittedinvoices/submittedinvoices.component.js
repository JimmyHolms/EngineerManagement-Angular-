'use strict';
import { ReadableAddress } from '../../../Utility/Utility';
import * as properties from '../../../properties';

export default class submittedinvoicesComponent {
  /*@ngInject*/
  constructor($http, $scope, Auth, $confirm, $uibModal, $route, Notification) {
    this.$http = $http;
    this.$scope = $scope;
    this.$route = $route;
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
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
    this.$http.get(properties.invoice_submitted)
      .then(response => {
        vss.Profile = response.data;

        vss.populateItems = response.data;

        vss.populateAproved();
      });
    this.$scope.reloadPage = function () {
      $http.get(properties.invoice_submitted)
      .then(response => {
        vss.Profile = response.data;

      });
    }


    this.changestatus = function (Job, index) {
      var jobid = Job;
      var text = 'Approve Invoice' + "  (" + Job.job_title + ")";
      var Profile = this.Profile;
     Job.actionstatus = this.actionstatus[0];
       var me = this;
      $confirm({ text: 'Are you sure you want to approve?', title: text, ok: 'Yes', cancel: 'No' })
        .then(function () {
          $http.put(properties.invoice_aproved + "/" + jobid.job_id)
            .then(response => {

              if (response.status == 204) {
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
                customer.actionstatus = "Unapproved";
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

  EditCurrentJob(job) {
    var vm = this;
this.editcurrent_job = job;
 this.editworkitemsTotal = 0;

    for (var i = 0, len = job.work_items.length; i < len; i++) {
      this.editworkitemsTotal += job.work_items[i].cost;
    }
    this.$http.get(properties.job_path + "/" + job.job_id).then(function successCallback(response) {

      vm.current_job = response.data;
      vm.editopenComponentModal();

    },
      function errorCallback(response) {

      });

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

  editopenComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('./Report/editsubmittedinformation.html'),
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
    
    
      vms.ok();
      vms.$scope.showSuccessAlert(); 
       vms.$http.get(properties.invoice_submitted)
      .then(response => {
        vms.Profile = response.data;

        vms.populateItems = response.data;

        vms.populateAproved();
      });
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
        if(this.Profile[i].is_approved)
        {
           
          this.Profile[i].actionstatus = this.actionstatus[1];
        }       
      else
      {
      
        this.Profile[i].actionstatus = this.actionstatus[0];

      }
      }
    }
  }

  addWorkItem() {
  
    this.current_job.invoice.work_items.push(this.current_workitem);
    this.editworkitemsTotal = 0;
  
    for (var i = 0, len = this.current_job.invoice.work_items.length; i < len; i++) {
      this.editworkitemsTotal += parseFloat(this.current_job.invoice.work_items[i].cost);
    }

  this.current_workitem = {};
 
  
 this.current_job.invoice.total =   this.editworkitemsTotal +  this.current_job.invoice.perhour_cost +  this.current_job.invoice.mileage_cost;

  }

}