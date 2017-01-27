'use strict';

import {
  UtilService
} from './util.service';

export default angular.module('applogix.util', [])
  .factory('Util', UtilService)
  .name;
