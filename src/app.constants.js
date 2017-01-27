'use strict';

import angular from 'angular';

export default angular.module('agfullstackApp.constants', [])
  .constant('appConfig', require('./shared'))
  .name;
