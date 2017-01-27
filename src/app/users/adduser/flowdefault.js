'use strict';
import * as properties from '../../../properties';

export default function flowFactoryProvider(flowFactoryProvider) {
  'ngInject';

  flowFactoryProvider.defaults = {
      target: "/",
      permanentErrors: [500, 501],
      maxChunkRetries: 1,
      chunkRetryInterval: 5000,
      simultaneousUploads: 1
    };

}