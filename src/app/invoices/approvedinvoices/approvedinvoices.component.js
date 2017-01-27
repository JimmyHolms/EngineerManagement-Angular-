'use strict';
import { ReadableAddress } from '../../../Utility/Utility';
import * as properties from '../../../properties';

export default class approvedinvoicesComponent {
  /*@ngInject*/
  constructor($http, $scope, Auth, $confirm, $uibModal, $route, Notification) {
    this.$http = $http;
    this.$scope = $scope;
    this.$route = $route;
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.$uibModal = $uibModal;
    var vss = this;
     this.current_Report;
    this.actionstatus = ["Unpaid", "Paid"];
    $(".alert").hide();   //Hides all the BS alerts on the page
    $scope.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
       $scope.cardshowSuccessAlert = function () {
      $("#cardsuccess-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cardsuccess-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    $scope.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

       $scope.cardshowFailureAlert = function () {
      $("#cardfailure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cardfailure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    $(".scroll-to-top").click();
    this.$http.get(properties.invoice_aprovelist)
      .then(response => {
        vss.Profile = response.data;
        vss.populateItems = response.data;
        vss.populatePaid();
      });

    this.changestatus = function (Job, index) {

      var jobid = Job;
      var text = 'Paid Invoice' + "  (" + Job.invoice.job_title + ")";
     // var Jobs = vss.Profile;
      var Profile = this.Profile
      Job.actionstatus = this.actionstatus[0];
      
     
      $confirm({ text: 'Are you sure you want to paid?', title: text, ok: 'Yes', cancel: 'No' })
        .then(function () {
          $http.put(properties.invoice_paid + "/" + jobid.job_id)
            .then(response => {

              if (response.status == 204) {
                Profile.splice(index, 1);
                Notification.success({
                  title: "Paid Success",
                  message: "Job(" + jobid.invoice.job_title + ")" + " successfully paid!",
                  positionX: 'right',
                  positionY: 'top',
                  delay: 1500
                });
              } else {
                customer.actionstatus = "Unpaid";
                Notification.error({
                  title: "Unpaid Failed",
                  message: "Job(" + jobid.job_title + ")" + " Unpaid  failed!",
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
    this.valids = "";
    this.JobDetails = job;
   
    var vms = this;
    this.getjobid = job.job_id;
    this.GetCard;

    this.currentcard = {
      charge_type: 'Credit Card Payment',
      card_id: '',
      charge_description: ''


    };
    this.$http.get(properties.job_path + "/" + job.job_id).then(function successCallback(response) {

      vms.$http.get(properties.customer_path + "/" + response.data.customer.user_id).then(function successCallback(response) {

        vms.current_job = response.data.payment_info;
  
        
        for (var i = 0; i < vms.current_job.cards.length; i++) {
          if (vms.current_job.cards[i].is_default) {

             //vms.current_job.cards[i].brand = vms.current_job.cards[i].brand + " " + vms.current_job.cards[i].last_digits  + " (default)";
             vms.current_job.cards[i].last_digits += " (default)";
           vms.GetCard =vms.current_job.cards[i].card_id

          //  vms.GetCard = vms.current_job.cards[i];
          }
        }
        vms.openComponentModal();

      },
        function errorCallback(response) {
          vms.$scope.showFailureAlert();
        });

    },
      function errorCallback(response) {

      });
  }

  openComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('./Report/approvedinformation.html'),
      scope: this.$scope,
      size: 'lg'
    });
    this.$scope.modalInstance = modalInstance;

    return modalInstance.result;
  }

  setManualCurrentJob(job) {
    this.valid = "";
    this.JobDetailsManual = job;
    var vms = this;
    this.getjobid = job.job_id;

    this.manualpayment = {
      charge_type: 'Manual Payment',    //Required field. It can also be set as "charge_type":"Manual Payment"
      card_id: '',
      charge_description: '',
      transaction_id: ''

    };
    this.openmanualComponentModal();
  }

  openmanualComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('./Report/manualapprovedinformation.html'),
      scope: this.$scope,
      size: 'lg'
    });
    this.$scope.modalInstance = modalInstance;

    return modalInstance.result;
  }
  ok() {

    this.$scope.modalInstance.close();
  }

  Collectpayment() {
    if (this.currentcard.charge_description != '') {
      var fruitId = this.currentcard.card_id;
      var vmthis = this;
     
      this.currentcard.card_id = this.GetCard;
      this.$http.put(properties.invoice_creditcard + "/" + this.getjobid, this.currentcard).then(function successCallback(response) {
        vmthis.ok();
          vmthis.$scope.cardshowSuccessAlert();
            vmthis.$http.get(properties.invoice_aprovelist)
      .then(response => {
        vmthis.Profile = response.data;
        vmthis.populateItems = response.data;
        vmthis.populatePaid();
      });
      },
        function errorCallback(response) {
           vmthis.ok();
          vmthis.$scope.cardshowFailureAlert();
           
        });
    }
    else {
      this.valids = "Please Enter Charge Description";
    }
  }

  CollectManualpayment() {
     var ss = this;
    if (this.manualpayment.charge_description != '') {
     
      this.$http.put(properties.invoice_creditcard + "/" + this.getjobid, this.manualpayment).then(function successCallback(response) {
        ss.ok();
          ss.$scope.cardshowSuccessAlert();
          ss.$http.get(properties.invoice_aprovelist)
      .then(response => {
        ss.Profile = response.data;
        ss.populateItems = response.data;
        ss.populatePaid();
      });
      },
        function errorCallback(response) {
           ss.ok();
        ss.$scope.cardshowFailureAlert();
        });

    }
    else {
      this.valid = "Please Enter Charge Description";

    }

  }
  cancel() {
    this.$scope.modalInstance.dismiss();
  }
  populatePaid() {

    var len = this.populateItems.length;

    if (len > 0) {
      for (var i = 0; i < len; i++) {
        this.Profile[i].actionstatus = this.actionstatus[0];
      }
    }
  }
  
 ShowReport(job) {

    this.current_Report = job;
    this.workitemsTotal = 0;

    for (var i = 0, len = job.work_items.length; i < len; i++) {
      this.workitemsTotal += job.work_items[i].cost;
    }

    this.ReportopenComponentModal();
  }
 ReportopenComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('./Report/reportinformation.html'),
      scope: this.$scope,
      size: 'lg'
    });
    this.$scope.modalInstance = modalInstance;

    return modalInstance.result;
  }
}

