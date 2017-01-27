'use strict';
import UserlistComponent from './userlist.component';
export default angular.module('apologix.userlist', ['datatables','ngResource','ui.bootstrap.rating'])
  .controller('UserlistComponent', UserlistComponent)
  .name;
