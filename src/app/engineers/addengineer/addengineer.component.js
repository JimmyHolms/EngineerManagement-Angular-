'use strict';
const angular = require('angular');

import * as properties from '../../../properties';

export default class AddengineerComponent {
  /*@ngInject*/
  constructor($http, $scope, $q, socket, $document) {
    this.$http = $http;
    this.$scope = $scope;
    this.$q = $q;
    this.socket = socket;
    this.$document = $document;
    this.errors = {};
    this.engineer = {};
    this.engineer.address = {};
    $scope.engineer_imagefile = null;
    $scope.current_certificateimage = null;
    $scope.current_certificatesrc = null;
    this.engineerType = [{ name: "Internal", value: "internal" }, { name: "External", value: "external" }];
    this.selectedType = this.engineerType[0];
    this.temp_skills = [];
    this.skills = [];
    this.currentcertification = {};
    this.submitted = false;
    this.skillvalidate = false;
    this.onInit();
    $(".alert").hide();
    $(".scroll-to-top").click();
    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showFailureAlert = function () {
      var result = this.getEnginnerAdditionErrors();
      $('#error-list').html(result).contents();
      $(".failure-addition-engineer").fadeTo(3000, 500).slideUp(500, function () { $(".failure-addition-engineer").slideUp(500); });
      $(".scroll-to-top").click();
    }
      $scope.ConflictFailureAlert = function () {
      $("#Conflictfailure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#Conflictfailure-alert").slideUp(500); });
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
    this.showImageUploadFailureAlert = function () {
      $("#failure-image-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-image-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    $("#photo_input").change(function () {
      $scope.engineer_imagefile = this.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#customer_photo').attr('src', reader.result);
      }
      reader.readAsDataURL($scope.engineer_imagefile);
    });
    $('#certificate_input').change(function () {
      $scope.current_certificateimage = this.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        $scope.current_certificatesrc = reader.result;
        $('#engineer_certificateimage').attr('src', reader.result);
      }
      reader.readAsDataURL($scope.current_certificateimage);
    });
    $('#certificate_date').datepicker({
      format: 'mm.dd.yyyy'
    });
    $('#expiry_date').datepicker({
      format: 'mm.dd.yyyy'
    });
  }
  onInit() {
    this.$http.get(properties.skill_path)
      .then(response => {
        this.skills = response.data.skills;
        this.copySkills();
        this.socket.syncUpdates('skill', this.skills);
      });
  }
  add(form) {
    var mss = this;
    this.submitted = true;
    this.type = this.selectedType.value;
    this.engineer.address.site_name = "Personal";
    this.engineer.address.location = {
      "longitude": 24.63765,
      "latitude": -1.45824
    };
    this.engineer.skills = [];
    for (var i = 0; i < this.temp_skills.length; i++) {
      var skill = this.temp_skills[i];
      if (!angular.isUndefined(skill.child_skills)) {
        this.engineer.skills.push(skill);
      }
    }
    // this.engineer.certifications = [];
    // if ((!angular.isUndefined(this.certifications)) && this.certifications != null) {
    //   for (var j = 0; j < this.certifications.length; j++) {
    //     var certificate = {};
    //     certificate.title = this.certifications[j].title;
    //     certificate.certification_date = this.certifications[j].certification_date;
    //     certificate.expiry_date = this.certifications[j].expiry_date;
    //     this.engineer.certifications.push(certificate);
    //   }
    // }
    if (this.engineer.skills.length > 0) {
      this.skillvalidate = true;
    } else {
      this.skillvalidate = false;
    }

    if (form.$valid && this.skillvalidate) {
      $('#loading_div').show();
      this.$http.post(properties.engineer_path, this.engineer)
        .then(response => {
          if (response.status == 201) {
            this.uploadImage(response.data.user_id, this.certifications);
            this.engineer = {};
            this.certifications = null;
            this.confirmPassword = null;
            this.temp_skills = [];
            this.copySkills();
            $('#customer_photo').attr('src', "/assets/images/avatar.jpg");
            this.submitted = false;
          } else {
           
            $('#loading_div').hide();
            this.errors =[];
            this.showFailureAlert();
            this.submitted = false;
          }
        },
        error => {
         
             mss.$scope.ConflictFailureAlert();
          $('#loading_div').hide();
          this.errors = error.data.errors;
      
        });
    }else{
     
      this.showValidationAlert();
         
    }

  }
  uploadCertificateImages(engineer_id, certifications) {
    var me = this;

    if (certifications.length < 1) {
      $('#loading_div').hide();
      this.showSuccessAlert();
      return;
    }
    var upload_imageArray = [];
    for (var i = 0; i < certifications.length; i++) {
      var imgaeFormData = this.makeUploadImageFormData(certifications[i].imgFile);
      var request = this.$http.post(properties.upload_engineer_certificateImage + "/" + engineer_id + "/"
        + certifications[i].title + "/" + certifications[i].certification_date + "/" + certifications[i].expiry_date
        , imgaeFormData, { transformRequest: angular.identity, headers: { 'Content-Type': undefined } });
      upload_imageArray.push(request);
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

  uploadImage(engineer_id, certifications) {
    if (this.$scope.engineer_imagefile == null) {
      if (angular.isArray(certifications)) {
        this.uploadCertificateImages(engineer_id, certifications);
        return;
      } else {
        $('#loading_div').hide();
        this.showSuccessAlert();
      }
    }
    var imageFormData = this.makeUploadImageFormData(this.$scope.engineer_imagefile);
    this.$http.post(properties.upload_engineer_profile + "/" + engineer_id, imageFormData, {
      transformRequest: angular.identity,
      headers: {
        'Content-Type': undefined
      }
    }).then(response => {
      if (response.status == 201) {
        this.uploadCertificateImages(engineer_id, certifications);
      } else {
        $('#loading_div').hide();
        this.showImageUploadFailureAlert();
      }
    });
  }
  setCurrentSkill(skill, index) {
    this.current_skill = skill;
    this.currentindex = index;
    $('.list-group-item').removeClass("active");
    this.setActiveClass();
  }
  copySkills() {
    var length = this.skills.length;
    if (length > 0) {
      this.current_skill = this.skills[0];
      this.currentindex = 0;
      this.setActiveClass();
      for (var i = 0; i < length; i++) {
        var skill = {};
        skill.skill_name = this.skills[i].skill_name;
        this.temp_skills.push(skill);
      }
    }
  }
  makeUploadImageFormData(image) {
    var imageFormData = new FormData();
    imageFormData.append("upload_image", image);
    return imageFormData;
  }
  setActiveClass() {
    $("#" + this.current_skill._id).addClass("active");
  }
  addCertification() {
    if (angular.isUndefined(this.certifications)) this.certifications = [];
    this.currentCertification.imgSrc = this.$scope.current_certificatesrc;
    this.currentCertification.imgFile = this.$scope.current_certificateimage;
    this.certifications.push(this.currentCertification);
    this.currentCertification = {};
    this.$scope.current_certificatesrc = null;
    this.$scope.current_certificateimage = null;
    $('#engineer_certificateimage').attr("src", "/assets/images/no_image.png");
  }

  removeCertification(index) {
    if (index != -1)
      this.certifications.splice(index, 1);
  }
  getEnginnerAdditionErrors() {
    var result = "";
    angular.forEach(this.errors, function(value, key) {
      result+=  '<div class="alert alert-danger failure-addition-engineer" ><strong>Engineer Addition Failure!  </strong>' + value.message + "</div>";
    });
    return result;
  }
  cancel() {
    this.engineer = {};
    this.certifications = null;
    this.confirmPassword = null;
    this.temp_skills = [];
    this.copySkills();
    $('#customer_photo').attr('src', "/assets/images/avatar.jpg");
  }
}
