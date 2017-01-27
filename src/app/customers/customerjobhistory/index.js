'use strict';
import 'angular-datatables';
import 'angular-confirm';
import customerjobhistoryComponent from './customerjobhistory.component';

export default angular.module('apologix.customerjobhistory', ['datatables', 'ngResource', 'angular-confirm'])
  .controller('customerjobhistoryComponent', customerjobhistoryComponent)
  .name;
