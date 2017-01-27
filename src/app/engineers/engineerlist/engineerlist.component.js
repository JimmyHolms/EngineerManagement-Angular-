'use strict';
const angular = require('angular');

import * as properties from '../../../properties';
import { ReadableAddress, setCorrectPhotoPath } from '../../../Utility/Utility';
export default class EngineerListComponent {
  /*@ngInject*/
  constructor($http, $scope, $location, $confirm, $timeout, $compile, socket, $uibModal, $uibModalStack, $resource, uiCalendarConfig, DTOptionsBuilder, DTColumnDefBuilder) {
    var me = this;
    this.$scope = $scope;
    this.$http = $http;
    this.socket = socket;
    this.$location = $location;
    this.$uibModal = $uibModal;
    this.$uibModalStack = $uibModalStack;
    this.uiCalendarConfig = uiCalendarConfig;
    this.animationsEnabled = true;
    this.scheduleSubmitted = false;
    this.schedule_entry = {};
    this.activestatus = ["Active", "Inactive"];
    $(".alert").hide();
    $(".scroll-to-top").click();
    this.engineer_message = "";
    this.onInit();
    this.dtOptions = DTOptionsBuilder.fromSource(this.enginners)
      .withPaginationType('full_numbers');
    this.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0),
      DTColumnDefBuilder.newColumnDef(1),
      DTColumnDefBuilder.newColumnDef(2),
      DTColumnDefBuilder.newColumnDef(3),
      DTColumnDefBuilder.newColumnDef(4).notSortable()
    ];
    // this.eventSource = {
    //   url: "http://www.google.com/calendar/feeds/usa__en%40holiday.calendar.google.com/public/basic",
    //   className: 'gcal-event'           // an option!
    // };
    this.events = [
    ];
    this.eventSources = [this.events];
    this.onEventClick = function (date, jsEvent, view) {
      me.schedule_entry = me.findEntry(date._id);
      me.openAddOrUpdateScheduleDetail(false);
    };
    this.eventRender = function (event, element, view) {
      element.attr({
        'uib-tooltip': event.title,
        'uib-tooltip-append-to-body': true
      });
      $compile(element)($scope);
    };
    this.uiConfig = {
      calendar: {
        height: 500,
        editable: true,
        header: {
          left: 'title',
          center: '',
          right: 'today prev,next'
        },
        eventClick: this.onEventClick,
        eventDrop: this.alertOnDrop,
        eventResize: this.alertOnResize,
        eventRender: this.eventRender
      }
    };

    $scope.renderCalendar = function (calendar) {
      $timeout(function () {
        if (this.uiCalendarConfig.calendars[calendar]) {
          this.uiCalendarConfig.calendars[calendar].fullCalendar('refetchEvents');
        }
      });
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('engineer');
    });
    this.showSuccessAlert = function () {
      $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }
    this.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    }

    this.changestatus = function (engineer) {
      var current_engineer = engineer;
      var me = this;
      var question_title = "";
      var top_title = "";
      var is_active = false;
      if (engineer.activestatus == this.activestatus[0]) {
        is_active = true;
        question_title = "Are you sure you want to active?";
        top_title = "Active engineer" + "(" + engineer.full_name + ")";
      } else {
        question_title = "Are you sure you want to inactive?";
        top_title = "Inactive engineer" + " (" + engineer.full_name + ")";
      }
      $confirm({ text: question_title, title: top_title, ok: 'Yes', cancel: 'No' })
        .then(function () {
          $http.put(properties.engineer_path + "/" + current_engineer.user_id, { "is_active": is_active })
            .then(response => {
              if (response.status == 204 || response.status == 200) {
                if (is_active == true) {
                  me.engineer_message = "Engineer  " + current_engineer.full_name + " successfully actived!";
                } else {
                  me.engineer_message = "Engineer  " + current_engineer.full_name + " successfully inactived!";
                }
                me.showSuccessAlert();
                me.onInit();
              } else {
                if (is_active == true) {
                  me.engineer_message = "Engineer  " + current_engineer.full_name + " activation failed!";
                } else {
                  me.engineer_message = "Engineer  " + current_engineer.full_name + " inactivation failed!";
                }
                me.showFailureAlert();
              }
            });
        });
    }

  }

  onInit() {
    this.$http.get(properties.approvedengineer_path)
      .then(response => {
        this.engineers = response.data;
        this.engineers.sort(function (a, b) { return a.created_datetime < b.created_datetime; });
        this.socket.syncUpdates('engineer', this.engineers);
      });
  }
  populateEngineers() {
    var len = this.engineers.length;
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        var is_active = this.engineers[i].is_active;
        if (is_active) {
          this.engineers[i].activestatus = this.activestatus[0];
        } else {
          this.engineers[i].activestatus = this.activestatus[1];
        }
      }
    }
  }
  updateScheduleData() {
    var eng_id = this.current_engineer.user_id;
    this.$http.get(properties.engineer_path + "/" + eng_id).then(response => {
      this.current_engineer = response.data;
      this.populateEvents();
    });
    this.scheduleSubmitted = false;
  }
  updateBeforeDialogShowing() {
    $('#loading_div').show();
    var eng_id = this.current_engineer.user_id;
    this.$http.get(properties.engineer_path + "/" + eng_id).then(response => {
      $('#loading_div').hide();
      this.current_engineer = response.data;
      this.populateEvents();
      this.openEngineerScheduleModal();
    }, error => {
      $('#loading_div').hide();
    });
  }
  findEntry(id) {
    var current_schedules = this.current_engineer.schedule;
    for (var i = 0; i < current_schedules.length; i++) {
      if (current_schedules[i]._id == id) {
        return current_schedules[i];
      }
    }
    return {};
  }
  setCorrectCertificatePath(src) {
    return setCorrectPhotoPath(src);
  }
  setEditEngineer(engineer) {
    this.$location.path("/editengineer/eng_id=" + engineer.user_id);
  }
  setCurrentEngineer(engineer) {
    this.current_engineer = engineer;
    this.current_engineer.average_rating = 5;
    //this.current_engineer.addressdetail = ReadableAddress(engineer.address);
    this.openComponentModal();
  }
  showEngineerSchedule(engineer) {
    this.current_engineer = engineer;
    this.updateBeforeDialogShowing();
  }
  setCorrectImagePath() {
    if (angular.isUndefined(this.current_engineer.image_path)) {
      return "/assets/images/avatar.jpg";
    } else {
      return setCorrectPhotoPath(this.current_engineer.image_path);
    }
  }
  openEngineerScheduleModal() {
    var modalStack = this.$uibModalStack;
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('./engineerschedule.html'),
      scope: this.$scope,
      overflow: 'auto',
      size: 'lg'
    });
    this.$scope.modalInstance = modalInstance;

    return modalInstance.result;
  }
  openComponentModal() {
    var modalInstance = this.$uibModal.open({
      animation: this.animationsEnabled,
      template: require('../showengineer/engineerinformation.html'),
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
  setCurrentStatus() {
    var active = this.current_engineer.is_active;
    if (active) {
      return this.activestatus[0];
    }
    return this.activestatus[1];
  }
  getsubskill(sub_skill) {
    if (angular.isArray(sub_skill)) {
      var skillstr = "";
      for (var i = 0; i < sub_skill.length; i++) {
        if (i != 0) {
          skillstr += " , ";
        }
        skillstr += sub_skill[i];
      }
      return skillstr;
    }
    return "";
  }

  /* Calendar */
  changeView(view, calendar) {
    this.uiCalendarConfig.calendars[calendar].fullCalendar('changeView', view);
  };
  closeScheduleDetail() {
    //this.setDefaultDateFalse();
    $('#Schedule_Detail').hide();
  }
  openAddOrUpdateScheduleDetail(flag) {
    var start_date, end_date;
    if (flag == true) {
      this.schedule_entry = {};
      start_date = new Date();
      end_date = new Date(start_date);
      end_date.setMinutes(start_date.getMinutes() + 30);
    } else {
      start_date = new Date(this.schedule_entry.sch_start);
      end_date = new Date(this.schedule_entry.sch_end);
    }
    $('#starttime').datetimepicker({ stepping: 30, format: 'YYYY-MM-DD HH:mm' });
    $('#endtime').datetimepicker({ stepping: 30, format: 'YYYY-MM-DD HH:mm' });
    $('#starttime').data("DateTimePicker").date(start_date);
    $('#endtime').data("DateTimePicker").date(end_date);
    $('#Schedule_Detail').show();
    this.isScheduleAdd = flag;
  }
  appendScheduleToCalendar(schedule_entry) {
    var event = {};
    event.start = new Date(schedule_entry.sch_start);
    event.end = new Date(schedule_entry.sch_end);
    event.title = schedule_entry.title;
    if (schedule_entry.available) {
      event.className = ['cal_available'];
    } else {
      event.className = ['cal_unavailable'];
    }
    //event.sch_type = schedule_entry.sch_type;
    event._id = schedule_entry._id;
    this.eventSources[0].push(event);
  }
  populateEvents() {
    this.eventSources[0].splice(0, this.eventSources[0].length);
    var current_schedules = this.current_engineer.schedule;
    if (angular.isArray(current_schedules)) {
      for (var i = 0; i < current_schedules.length; i++) {
        this.appendScheduleToCalendar(current_schedules[i]);
      }
    }
    //this.eventSources = [this.events];
    //this.$scope.$apply();
    //this.$scope.renderCalendar('myCalendar1');
  }
  saveSchedule(form) {
    this.scheduleSubmitted = true;
    if (form.$valid && !this.isDateInCorrect()) {
      var start_date = $('#input_sch_start').val() + ":00";
      var end_date = $('#input_sch_end').val() + ":00";
      this.schedule_entry.sch_start = start_date;
      this.schedule_entry.sch_end = end_date;
      this.$http.put(properties.engineer_path + "/" + this.current_engineer.user_id + "/schedule", this.schedule_entry).then(response => {
        if (response.status == 200) {
          this.schedule_entry = response.data;
        } else {

        }
        this.updateScheduleData();
        this.closeScheduleDetail();
      });
    }
  }
  isDateInCorrect() {
    if ($('#input_sch_start').val() != "" && $('#input_sch_end').val() != "") {
      var startdate = new Date($('#input_sch_start').val());
      var enddate = new Date($('#input_sch_end').val());
      if (startdate < enddate) {
        return false;
      }
      return true;
    }
    return true;
  }
  deleteSchedule() {
    var id = this.schedule_entry._id;
    if (id != null) {
      this.$http.delete(properties.engineer_path + "/" + this.current_engineer.user_id + "/schedule" + "/" + id).then(response => {
        if (response.status == 204) {
        } else {
        }
        this.updateScheduleData();
        this.closeScheduleDetail();
      });
    }
  }
}


