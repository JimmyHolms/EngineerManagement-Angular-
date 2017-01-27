'use strict';

import angular from 'angular';
const ngRoute = require('angular-route');

import routing from './engineers.routes';
import addEngineer from './addengineer';
import editEngineer from './editengineer';
import engineerList from './engineerlist';
import engineerApproval from './engineerapproval';
import engineerCalendar from './engineercalendar';
export default angular.module('agfullstackApp.engineers', [ngRoute, addEngineer , editEngineer , engineerList , engineerApproval,engineerCalendar])
  .config(routing)
  .name;
