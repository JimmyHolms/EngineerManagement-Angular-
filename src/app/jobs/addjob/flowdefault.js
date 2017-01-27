'use strict';
import * as properties from '../../../properties';

export default function flowFactoryProvider(flowFactoryProvider) {
  'ngInject';

  flowFactoryProvider.defaults = {
      target: "/"
    };

}