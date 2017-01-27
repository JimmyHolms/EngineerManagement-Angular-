'use strict';

import angular from 'angular';
const ngRoute = require('angular-route');

import routing from './jobs.routes';
import addJob from './addjob';
import editJob from './editjob';
import jobcategorymanage from './managecategories';
import joblistbyengineer from './jobListByEngineer';
import {JobResource} from './job.service';

export default angular.module('agfullstackApp.jobs', [ngRoute, addJob ,editJob ,jobcategorymanage,joblistbyengineer])
  .factory('Job',JobResource)
  .config(routing)
  .name;
