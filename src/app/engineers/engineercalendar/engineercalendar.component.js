'use strict';
const angular = require('angular');

import * as properties from '../../../properties';

export default class EngineerCalendarComponent {
  /*@ngInject*/
  constructor($http, $scope, $q, socket, $document) {
    this.$http = $http;
    this.$scope = $scope;
    this.$q = $q;
    this.socket = socket;
    this.eventSources = [];
    this.uiConfig = {
      calendar:{
        height: 450,
        editable: true,
        header:{
          left: 'month basicWeek basicDay agendaWeek agendaDay',
          center: 'title',
          right: 'today prev,next'
        },
        eventClick: $scope.alertEventOnClick,
        eventDrop: $scope.alertOnDrop,
        eventResize: $scope.alertOnResize
      }
    };
  }
  
}
