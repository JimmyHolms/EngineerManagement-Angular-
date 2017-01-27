'use strict';

import AddengineerComponent from './addengineer.component';
import 'checklist-model';
export default angular.module('agfullstackApp.addengineer', ["checklist-model"])
  .controller('AddEngineerComponent', AddengineerComponent)
  .name;
