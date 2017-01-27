'use strict';
import '@flowjs/ng-flow';
import flowFactoryProvider from './flowdefault';
import AddjobComponent from './addjob.component';

export default angular.module('agfullstackApp.addjob', ['flow'])
  .controller('AddJobComponent', AddjobComponent)
  .config(flowFactoryProvider)
  .name;
