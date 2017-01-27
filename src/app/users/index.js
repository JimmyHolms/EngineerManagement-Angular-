'use strict';

import angular from 'angular';
const ngRoute = require('angular-route');

import routing from './users.routes';
import addUser from './adduser';
import editUser from './edituser';
import userList from  './userlist';

export default angular.module('agfullstackApp.users', [ngRoute, addUser , editUser , userList])
  .config(routing)
  .name;
