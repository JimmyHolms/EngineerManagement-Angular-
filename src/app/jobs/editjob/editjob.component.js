'use strict';
const angular = require('angular');
import * as properties from '../../../properties';
import { setCorrectImagePath } from '../../../Utility/Utility';

export default class EditjobComponent {
  /*@ngInject*/
  constructor($routeParams, $q, $filter, $http, $scope, socket) {
    this.$http = $http;
    this.$filter = $filter;
    this.$q = $q;
    this.$scope = $scope;
    this.socket = socket;
    this.current_workitem = {};
    $scope.current_workitemImageSrc = null;
    $scope.current_workitemImageFile = null;
    var job_id = $routeParams.jid.split("=")[1];
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

    this.showSomeImageFailed = function () {
      $("#someimagefailed-alert").fadeTo(3000, 500).slideUp(500, function () { $("#someimagefailed-alert").slideUp(500); });
      $(".scroll-to-top").click();

    }
    this.onInit(job_id);
    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('customer');
      socket.unsyncUpdates('jobcategories');
      socket.unsyncUpdates('jobschedule');
      socket.unsyncUpdates('job');
    });
    $('#workitem_input').change(function () {
      $scope.current_workitemImageFile = this.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        $scope.current_workitemImageSrc = reader.result;
        $('#workitem_image').attr('src', reader.result);
      }
      reader.readAsDataURL($scope.current_workitemImageFile);
    });
    // Flow.prototype.addExistingFile = function (file, event) {
    //   var f = new Flow.FlowFile(this, file);
    //   this.files.push(f);
    // };
  }
  onInit(job_id) {
    var customerPromise = this.$http.get(properties.customer_path);
    var jobschedulePromise = this.$http.get(properties.jobscheduling_path);
    var categoryPromise = this.$http.get(properties.category_path);
    var jobPromise = this.$http.get(properties.job_path + "/" + job_id);
    var combinedPromise = this.$q.all({
      customer: customerPromise,
      jobschedule: jobschedulePromise,
      category: categoryPromise,
      job: jobPromise
    });
    combinedPromise.then(response => {
      this.atlasCustomers = response.customer.data;
      this.jobCategories = response.category.data;
      this.jobSchedulingOptions = response.jobschedule.data;
      this.job = response.job.data;
      this.jobCategories.categories.sort(function (a, b) { a.child_categories.sort(); return a.category_name > b.category_name; });
      this.jobSchedulingOptions.schedules.sort(function (a, b) { return a.offset_in_days > b.offset_in_days; });
      this.socket.syncUpdates('customer', this.atlasCustomers);
      this.socket.syncUpdates('jobcategories', this.jobCategories);
      this.socket.syncUpdates('jobschedule', this.jobSchedulingOptions);
      this.socket.syncUpdates('job', this.job);
      this.setExistingFile();
      this.changeValueForOption();
    }, error => {
    });
  }
  getImageFileName(path) {
    if (angular.isUndefined(path)) {
      return "";
    }
    if (!path.includes("/")) {
      return path;
    }
    //var n = path.lastIndexOf("/");
    var filename = path.substring(path.lastIndexOf("/") + 1);
    return filename;
  }
  setExistingFile() {
    if (angular.isUndefined(this.job.images) || this.job.images == null) {
      return;
    }
    var flowobj = this.flowname;
    // this.flowobj.files = [];
    // var flowfiles = this.flowobj.files;
    for (var i = 0; i < this.job.images.length; i++) {
      var image = this.job.images[i];
      var image_filename = this.getImageFileName(image.image_path);
      blobUtil.imgSrcToBlob(setCorrectImagePath(image.image_path), 'image/png',
        { crossOrigin: 'Anonymous' }).then(function (blob) {
          var file = blob;
          file.name = image_filename;
          flowobj.addFile(file);
          //flowobj.addExistingFile(blob);
          // ladies and gents, we have a blob 
        }).catch(function (err) {
          // image failed to load 
        });
    }
  }
  removeWorkItem(index) {
    if (index != -1)
      this.job.work_items.splice(index, 1);
  }
  addWorkItem() {
    //if (angular.isUndefined(this.job.work_items)) this.job.work_items = [];
    // this.current_workitem.imgFile = this.$scope.current_workitemImageFile;
    this.current_workitem.image_path = this.$scope.current_workitemImageSrc;
    var imgaeFormData = this.makeUploadImageFormData(this.$scope.current_workitemImageFile);
    $('#loading_div').show();
    this.$http.post(properties.upload_job_workitemPath + "/" + this.job.job_id + "/"
      + this.current_workitem.name + "/" + this.current_workitem.cost, imgaeFormData,
      { transformRequest: angular.identity, headers: { 'Content-Type': undefined } })
      .then(response => {
        if (response.status == 201) {
          // this.$http.get(properties.job_path + "/" + this.job.job_id).then(response => {
          //   this.job.work_items = response.data.work_items;
          //   $('#loading_div').hide();
          // });
          this.job.work_items.push(this.current_workitem);
          this.current_workitem = {};
          $('#loading_div').hide();
        } else {
          $('#loading_div').hide();
        }
      }, error => { $('#loading_div').hide(); });
    //this.job.work_items.push(this.current_workitem);

    this.$scope.current_workitemImageSrc = null;
    this.$scope.current_workitemImageFile = null;
    $('#workitem_image').attr("src", "/assets/images/no_image.png");
  }
  getSignOffImage() {
    // if (angular.isUndefined(this.job.signoff)) {
    //   return "/assets/images/no_image.png";
    // }
    // return setCorrectImagePath(this.job.signoff.image_path);
  }
  setRightImagePath(src) {
    if (src.includes("data:image")) {
      return src;
    }
    return setCorrectImagePath(src);
  }
  changeValueForOption() {
    this.selectedParentCategory = {};
    this.selectedSchedule = {};
    this.selectedParentCategory.category_name = this.job.category_l1;
    this.selectedParentCategory.child_categories = this.getChildCategoryByName(this.job.category_l1);
    this.selectedCustomer = this.getCustomerByName(this.job.customer.full_name);
    this.selectedSchedule.schedule_name = this.job.schedule;
  }
  changeChildCategory() {
    this.job.category_l2 = this.selectedParentCategory.child_categories[0];
  }

  setDefaultAddress() {
    this.job.address = this.selectedCustomer.addresses[0];
  }
  getCustomerByName(full_name) {
    for (var i = 0; i < this.atlasCustomers.length; i++) {
      if (this.atlasCustomers[i].full_name == full_name) {
        if (!this.isExistingAddress(this.atlasCustomers[i].addresses, this.job.address)) {
          this.atlasCustomers[i].addresses.push(this.job.address);
        }
        return this.atlasCustomers[i];
      }
    }
    return null;
  }
  isExistingAddress(addresses, address) {
    for (var i = 0; i < addresses.length; i++) {
      if (addresses[i].site_name == address.site_name) {
        return true;
      }
    }
    return false;
  }
  getChildCategoryByName(name) {
    var categories = this.jobCategories.categories;
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].category_name == name) {
        return categories[i].child_categories;
      }
    }
    return null;
  }
  makeUploadImageFormData(image) {
    var imageFormData = new FormData();
    imageFormData.append("upload_image", image);
    return imageFormData;
  }
  uploadWorkItemImage(job_id) {
    var me = this;
    var workitems = this.job.work_items;
    if (workitems.length < 1) {
      $('#loading_div').hide();
      this.showSuccessAlert();
      return;
    }
    var upload_imageArray = [];
    for (var i = 0; i < workitems.length; i++) {
      if ((!angular.isUndefined(workitems[i].imgFile)) && (workitems[i].imgFile != null)) {
        var imgaeFormData = this.makeUploadImageFormData(workitems[i].imgFile);
        var request = this.$http.post(properties.upload_job_workitemPath + "/" + job_id + "/"
          + workitems[i].name + "/" + workitems[i].cost, imgaeFormData,
          { transformRequest: angular.identity, headers: { 'Content-Type': undefined } });
        upload_imageArray.push(request);
      }
    }
    if (upload_imageArray.length < 1) {
      $('#loading_div').hide();
      this.showSuccessAlert();
      return;
    } else {
      this.$q.all(upload_imageArray).then(function () {
        $('#loading_div').hide();
        me.showSuccessAlert();
      });
    }
  }

  uploadImage(job_id) {
    var me = this;
    var files = this.flowname.files;
    if (angular.isArray(files)) {
      var length = files.length;
      if (length < 1) {
        this.showSuccessAlert();
        return;
      } else {
        $('#loading_div').show();
        var uploadRequestArray = [];
        for (var i = 0; i < files.length; i++) {
          var formData = this.makeUploadImageFormData(files[i].file);
          var request = this.$http.post(properties.upload_job_imagePath + "/" + job_id, formData,
            { transformRequest: angular.identity, headers: { 'Content-Type': undefined } });
          uploadRequestArray.push(request);
        }
        this.$q.all(uploadRequestArray).then(function (results) {
          for (var i = 0; i < results.length; i++) {
            if (results[i].status!=201) {
              // these are errors
              $('#loading_div').hide();
              me.showSomeImageFailed();
              return;
            }
          }
          $('#loading_div').hide();
          this.showSuccessAlert();
        });
      }
    } else {
      this.showSuccessAlert();
      return;
    }
  }
  update() {
    if (!this.validate()) {
      this.showValidationAlert();
      return;
    }
    this.post_job = {};
    this.post_job.title = this.job.title;
    this.post_job.description = this.job.description;
    this.post_job.category_l1 = this.selectedParentCategory.category_name;
    this.post_job.category_l2 = this.job.category_l2;
    this.post_job.current_status = this.job.current_status;
    this.post_job.address = this.job.address;
    this.post_job.images = this.job.images;
    this.post_job.work_items = this.job.work_items;
    // if (!angular.isUndefined(this.job.work_items)) {
    //   this.post_job.work_items = [];
    //   for (var i = 0; i < this.job.work_items.length; i++) {
    //     var work_item = {};
    //     work_item.name = this.job.work_items[i].name;
    //     work_item.cost = this.job.work_items[i].cost;
    //     work_item.datetime = this.job.work_items[i].datetime;
    //     this.post_job.work_items.push(work_item);
    //   }
    // }
    var config = 'contenttype';
    this.$http.put(properties.job_path + "/" + this.job.job_id, this.post_job, config).then(
      response => {
        this.uploadImage(this.job.job_id);
      },
      error => {
        this.showFailureAlert();
      }
    )
  }

  cancel() {
    this.onInit(this.job.job_id);
    this.showCancelAlert();
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
