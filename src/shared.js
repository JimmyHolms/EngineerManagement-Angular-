'use strict';

exports = module.exports = {
  // List of user roles
  userRoles: ['guest', 'user', 'admin'],
  rescheduleReasons: [
    {
      _id: 1,
      reason: 'Different Engineer Skills Required',
      requireReassignment: true
    },
    {
      _id: 2,
      reason: 'Part not Available',
      requireReassignment: false
    }
  ]  
};
