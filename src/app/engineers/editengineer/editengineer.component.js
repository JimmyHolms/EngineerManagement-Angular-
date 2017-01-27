'use strict';
const angular = require('angular');

import { setCorrectPhotoPath,setCorrectImagePath } from '../../../Utility/Utility';
import * as properties from '../../../properties';

export default class EditengineerComponent {
  /*@ngInject*/
  constructor($http, $routeParams, $q, $scope, socket, $document) {
    this.$http = $http;
    this.$scope = $scope;
    this.$q = $q;
    this.socket = socket;
    this.$document = $document;
    this.engineerType = [{ name: "Internal", value: "internal" }, { name: "External", value: "external" }];
    this.selectedType = this.engineerType[0];
    this.temp_skills = [];
    this.current_skill = null;
    this.skills = [];
    this.engineer = {};
    this.currentcertification = {};
    this.newcertifications = [];
    //$scope.certifications = [];
    $scope.engineer_imagefile = null;
    $scope.current_certificateimage = null;
    $scope.current_certificatesrc = null;

    this.submitted = false;
    this.skillvalidate = false;
    var eng_id = $routeParams.eng_id.split("=")[1];
    this.onInit(eng_id);
    $(".alert").hide();
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
    this.showForgotPasswordSuccessAlert = function () {
      $("#success-forgotpassword-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-forgotpassword-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showForgotPasswordFailureAlert = function () {
      $("#failed-forgotpassword-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failed-forgotpassword-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    $("#photo_input").change(function () {
      $scope.engineer_imagefile = this.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#engineer_photo').attr('src', reader.result);
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
    // this.setCertificateImageBlob=function() {
    //   if (angular.isArray(this.engineer.certifications)) {
    //     for (var i = 0; i < this.engineer.certifications.length; i++) {
    //       var certificate = this.engineer.certifications[i];
    //       certificate.imgFile = null;
    //       if (certificate.image_path != null && certificate.image_path != "") {
    //         var image_filename = this.getImageFileName(certificate.image_path);
    //         blobUtil.imgSrcToBlob(setCorrectPhotoPath(certificate.image_path), 'image/png',
    //           { crossOrigin: 'Anonymous' }).then(function (blob) {
    //             var file = blob;
    //             file.name = image_filename;
    //             certificate.imgFile = file;
    //             $scope.certifications.push(certificate);
    //           }).catch(function (err) {
    //             $scope.certifications.push(certificate);
    //           });
    //       } else {
    //         $scope.certifications.push(certificate);
    //       }
    //     }
    //   }
    // }
  }
  onInit(eng_id) {
    this.$http.get(properties.engineer_path + "/" + eng_id)
      .then(response => {
        this.engineer = response.data;
        if (angular.isUndefined(this.engineer.image_path)) {
          $('#engineer_photo').attr('src', "/assets/images/avatar.jpg");
        } else {
          this.engineer.image_path = setCorrectPhotoPath(this.engineer.image_path);
          $('#engineer_photo').attr('src', this.engineer.image_path);
        }
        //this.setCertificateImageBlob();
        this.getSkillList();
      }, error => {
        this.getSkillList();
      }
      );
  }
  getSkillList() {
    this.$http.get(properties.skill_path)
      .then(response => {
        this.skills = response.data.skills;
        this.copySkills();
        this.socket.syncUpdates('skill', this.skills);
      });
  }
  isCorrectImagePath(path) {
    if (angular.isUndefined(path) || path == null || path == "") {
      return false;
    }
    return true;
  }
  getImageFileName(path) {
    if (angular.isUndefined(path)) {
      return "";
    }
    if (!path.includes("/")) {
      return path;
    }
    var filename = path.substring(path.lastIndexOf("/") + 1);
    return filename;
  }
  setCorrectPath(src) {
    if (src.includes("data:image")) {
      return src;
    }
    return setCorrectImagePath(src);
  }
  forgotPassword() {
    this.$http.post(properties.forgot_engineer_password, { "email": this.engineer.email }).then(response => {
      if (response.status == 200) {
        this.showForgotPasswordSuccessAlert();
      } else {
        this.showForgotPasswordFailureAlert();
      }
    }, error => {
      this.showForgotPasswordFailureAlert();
    });
  }
  update(form) {
    this.submitted = true;
    this.post_engineer = {};
    this.post_engineer.full_name = this.engineer.full_name;
    this.post_engineer.mobile_number = this.engineer.mobile_number;
    this.post_engineer.company_name = this.engineer.company_name;
    this.post_engineer.designation = this.engineer.designation;
    this.post_engineer.experience = this.engineer.experience;
    this.post_engineer.type = this.selectedType.value;
    this.post_engineer.skills = [];
    for (var i = 0; i < this.temp_skills.length; i++) {
      var skill = this.temp_skills[i];
      if (!angular.isUndefined(skill.child_skills) && skill.child_skills.length>0) {
        this.post_engineer.skills.push(skill);
      }
    }
    if (this.post_engineer.skills.length > 0) {
      this.skillvalidate = true;
    } else {
      this.skillvalidate = false;
    }

    this.post_engineer.address = this.engineer.address;
    this.post_engineer.certifications = this.engineer.certifications;
    // this.post_engineer.certifications = [];
    // if (angular.isArray(this.engineer.certifications)) {
    //   for (var j = 0; j < this.engineer.certifications.length; j++) {
    //     var certificate = {};
    //     certificate.title = this.engineer.certifications[j].title;
    //     certificate.certification_date = this.engineer.certifications[j].certification_date;
    //     certificate.expiry_date = this.engineer.certifications[j].expiry_date;
    //     this.post_engineer.certifications.push(certificate);
    //   }
    //}

    if (form.$valid && this.skillvalidate) {
      var config = 'contenttype';
      this.$http.put(properties.engineer_path + "/" + this.engineer.user_id, this.post_engineer, config)
        .then(response => {
          if (response.status == 200) {
            $('#loading_div').show();
            this.uploadImage();
          } else {
            this.showFailureAlert();
          }
        }, error => {
          this.showFailureAlert();
        });
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
      // if ((!angular.isUndefined(certifications[i].imgFile)) && (certifications[i].imgFile != null)) {
      var imgaeFormData = this.makeUploadImageFormData(certifications[i].imgFile);
      var request = this.$http.post(properties.upload_engineer_certificateImage + "/" + engineer_id + "/"
        + certifications[i].title + "/" + certifications[i].certification_date + "/" + certifications[i].expiry_date
        , imgaeFormData, { transformRequest: angular.identity, headers: { 'Content-Type': undefined } });
      upload_imageArray.push(request);
      //}
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
  uploadImage() {
    var engineer_id = this.engineer.user_id;
    if (this.$scope.engineer_imagefile == null) {
      this.uploadCertificateImages(engineer_id, this.newcertifications);
      return;
    }
    var imageFormData = this.makeUploadImageFormData(this.$scope.engineer_imagefile);
    this.$http.post(properties.upload_engineer_profile + "/" + engineer_id, imageFormData, {
      transformRequest: angular.identity,
      headers: {
        'Content-Type': undefined
      }
    }).then(response => {
      if (response.status == 201) {
        this.uploadCertificateImages(engineer_id, this.newcertifications);
      } else {
        $('#loading_div').hide();
        this.showImageUploadFailureAlert();
      }
    });
  }

  makeUploadImageFormData(image) {
    var imageFormData = new FormData();
    imageFormData.append("upload_image", image);
    return imageFormData;
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
        if (angular.isArray(this.engineer.skills)) {
          for (var j = 0; j < this.engineer.skills.length; j++) {
            if (skill.skill_name == this.engineer.skills[j].skill_name) {
              skill.child_skills = this.engineer.skills[j].child_skills;
              break;
            }
          }
        }
        this.temp_skills.push(skill);
      }
    }
  }

  setActiveClass() {
    if(this.current_skill!=null){
      $("#" + this.current_skill._id).addClass("active");
    }
  }
  addCertification() {
    if (angular.isUndefined(this.newcertifications)) this.newcertifications = [];
    this.currentCertification.image_path = this.$scope.current_certificatesrc;
    this.currentCertification.imgFile = this.$scope.current_certificateimage;
    this.newcertifications.push(this.currentCertification);
    this.$scope.current_certificatesrc = null;
    this.$scope.current_certificateimage = null;
    this.currentCertification = {};
    $('#engineer_certificateimage').attr("src", "/assets/images/no_image.png");
  }

  removeCertification(index, mode) {
    if (mode == 1) {
      if (index != -1)
        this.engineer.certifications.splice(index, 1);
    } else if (mode == 2) {
      this.newcertifications.splice(index, 1);
    }
  }
  cancel() {
    this.temp_skills = [];
    this.onInit(this.engineer.user_id);
    setTimeout(function () {
      $("#cancel-alert").fadeTo(3000, 500).slideUp(500, function () { $("#cancel-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }, 1000);
  }

}
