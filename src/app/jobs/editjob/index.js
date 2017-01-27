'use strict';

import EditjobComponent from './editjob.component';
import flowFactoryProvider from '../addjob/flowdefault';
import '@flowjs/ng-flow';

export default angular.module('appologix.editjob', ['flow'])
  .controller('EditJobComponent', EditjobComponent)
  .config(flowFactoryProvider)
  .name;
