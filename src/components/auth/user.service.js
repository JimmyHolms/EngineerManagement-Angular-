'use strict';
import * as properties from '../../properties';

export function UserResource($resource) {
  'ngInject';

  return $resource(properties.signup_path + '/:id/:controller', {
    id: '@_id'
  }, {
      changePassword: {
        method: 'PUT',
        params: {
          controller: 'password'
        }
      },
      get: {
        method: 'GET',
        params: {
          id: 'me'
        }
      }
    });
}
