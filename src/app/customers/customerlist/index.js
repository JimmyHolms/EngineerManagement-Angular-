'use strict';
import CustomerListComponent from './customerlist.component';
export default angular.module('apologix.customerlist', ['ngResource'])
  .controller('CustomerListComponent', CustomerListComponent)
  .name;
