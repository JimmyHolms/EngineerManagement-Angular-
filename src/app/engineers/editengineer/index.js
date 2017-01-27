'use strict';

import EditengineerComponent from './editengineer.component';
import 'checklist-model';
export default angular.module('appologix.editengineer', ["checklist-model"])
  .controller('EditEngineerComponent', EditengineerComponent)
  .name;
