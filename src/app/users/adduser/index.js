'use strict';
import '@flowjs/ng-flow';
import flowFactoryProvider from './flowdefault';
import AdduserComponent from './adduser.component';
export default angular.module('apologix.adduser', ['flow'])
  .controller('AdduserComponent', AdduserComponent)
  .config(flowFactoryProvider)
  .name;
