'use strict';
import JobListByEngineerComponent from './joblistbyengineer.component';
import custom_carousel from '../../../components/carousel/carousel.component';
export default angular.module('appologix.joblistbyengineer', [custom_carousel])
  .controller('JobListByEngineerComponent', JobListByEngineerComponent)
  .name;
