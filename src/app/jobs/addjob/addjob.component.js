'use strict';
const angular = require('angular');
import * as properties from '../../../properties';
export default class AddjobComponent {
  /*@ngInject*/
  constructor($http, $q, $scope, socket) {
    this.$http = $http;
    this.$q = $q;
    this.socket = socket;
    this.job = null;
    this.flowobj = null;

    $(".alert").hide();   //Hides all the BS alerts on the page
    $(".scroll-to-top").click();

    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.showCancelAlert = function () {
      $("#cancel-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cancel-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.showValidationAlert = function () {
      $("#validation-alert").fadeTo(3000, 500).slideUp(500, function () { $("#validation-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.$http.get(properties.customer_path)
      .then(response => {
        this.atlasCustomers = response.data;
        this.socket.syncUpdates('customer', this.atlasCustomers);
      });

    this.$http.get(properties.jobscheduling_path)
      .then(response => {
        this.jobSchedulingOptions = response.data;
        this.jobSchedulingOptions.schedules.sort(function (a, b) { return a.offset_in_days > b.offset_in_days; });
        this.selectedSchedule = this.jobSchedulingOptions.schedules[0];
      });

    this.$http.get(properties.category_path)
      .then(response => {
        this.jobCategories = response.data;
        this.jobCategories.categories.sort(function (a, b) { a.child_categories.sort(); return a.category_name > b.category_name; });
        this.selectedCategoryL1 = this.jobCategories.categories[0];
        this.selectedCategoryL2 = this.selectedCategoryL1.child_categories[0];
      });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('customer');
    });
  }

  changeChildCategory() {
    this.selectedCategoryL2 = this.selectedCategoryL1.child_categories[0];
  }

  selectDefaultAddress() {
    this.selectedaddress = this.selectedCustomer.addresses[0];
    this.populateAddress(this.selectedaddress);
  }

  populateAddress(address) {
    if (this.job == null) this.job = {};
    this.job.address = address;
  }
  makeUploadImageFormData(image) {
    var imageFormData = new FormData();
    imageFormData.append("upload_image", image);
    return imageFormData;
  }
  uploadJobImage(job_id) {
    var me = this;
    var files = this.flowobj.files;
    if (angular.isArray(files)) {
      var length = files.length;
      if (length < 1) {
        this.showSuccessAlert();
      } else {
        $('#loading_div').show();
        var uploadRequestArray = [];
        for (var i = 0; i < files.length; i++) {
          var formData = this.makeUploadImageFormData(files[i].file);
          var request = this.$http.post(properties.upload_job_imagePath + "/" + job_id, formData,
            { transformRequest: angular.identity, headers: { 'Content-Type': undefined } });
          uploadRequestArray.push(request);
        }
        this.$q.all(uploadRequestArray).then(function(){
            me.showSuccessAlert();
             $('#loading_div').hide();
        });
      }
    } else {
      this.showSuccessAlert();
    }
  }
  add() {
    if (!this.validate()) {
      this.showValidationAlert();
      return;
    }
    //Creating Job Object with remaining items
    if (this.job == null) this.job = {};
    this.job.category_l1 = this.selectedCategoryL1.category_name;
    this.job.category_l2 = this.selectedCategoryL2;
    this.job.schedule = this.selectedSchedule.schedule_name;
    this.job.customer = {
      user_id: this.selectedCustomer.user_id,
      full_name: this.selectedCustomer.full_name,
      company_name: this.selectedCustomer.company_name,
      email: this.selectedCustomer.email,
      mobile_number: this.selectedCustomer.mobile_number
    };

    //Posting Job
    this.$http.post(properties.job_path, this.job)
      .then(response => {
        var job_id = response.data.job_id;
        this.uploadJobImage(job_id);
        this.job = null;
      },
      error => {
        //this.errorResponse = error.data;
        this.showFailureAlert();
      });
  }

  cancel() {
    if (this.selectedCustomer != null || this.job != null) this.showCancelAlert();
    this.selectedCustomer = '';
    this.job = null;
  }

  validate() {
    var result = true;

    if (this.selectedCustomer == null) {
      this.highlight($("#customer"));
      result = false;
    }
    else this.unhighlight($("#customer"));

    if (this.job == null || this.job.address == null || this.job.address.site_name == null) {
      this.highlight($("#sitename"));
      result = false;
    }
    else this.unhighlight($("#sitename"));

    return result;
  }

  highlight(field) {
    field.closest(".form-group").addClass("has-error");
  }

  unhighlight(field) {
    field.closest(".form-group").removeClass("has-error");
  }
}
