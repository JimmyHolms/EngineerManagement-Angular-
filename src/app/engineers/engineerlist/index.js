'use strict';
import EngineerListComponent from './engineerlist.component';
export default angular.module('apologix.engineerlist', ['ngResource','ui.bootstrap.rating','ui.calendar','ui.bootstrap'])
  .controller('EngineerListComponent', EngineerListComponent)
  .name;
