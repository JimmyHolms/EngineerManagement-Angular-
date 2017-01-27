'use strict';

import EngineerCalendarComponent from './engineercalendar.component';
import 'angular-ui-calendar';

export default angular.module('agfullstackApp.engineercalendar',['ui.calendar'])
  .controller('EngineerCalendarComponent', EngineerCalendarComponent)
  .name;
