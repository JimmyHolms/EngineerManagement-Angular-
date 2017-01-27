'use strict';
import angular from 'angular';
import ngCookies from 'angular-cookies';
import ngResource from 'angular-resource';
import ngSanitize from 'angular-sanitize';
import 'angular-socket-io';
import uiBootstrap from 'angular-ui-bootstrap';
import 'angular-datatables';
import 'angular-confirm';
const ngRoute = require('angular-route');

import {
  routeConfig
} from './app.config';

import AppComponent from './app.component';
import constants from './app.constants';
import main from './app/main/main.component';
import account from './app/account';
import jobs from './app/jobs';
import users from './app/users';
import engineers from './app/engineers';
import customers from './app/customers';
import dashboard from './app/dashboard/dashboard.component';
import invoices from './app/invoices';
import customerjobhistory from './app/customers/customerjobhistory/customerjobhistory.component';

import _Auth from './components/auth/auth.module';
import navbar from './components/navbar/navbar.component';
import menubar from './components/menubar/menubar.component';
import socket from './components/socket/socket.service';
import util from './components/util/util.module';
import custom_carousel from './components/carousel/carousel.component';
import notification from './components/notification/notification.component';
import './app.scss';

const root = angular
  .module('applogix', [
    ngCookies, ngResource, ngSanitize, 'btford.socket-io','datatables', 'angular-confirm',notification,ngRoute, uiBootstrap,
    _Auth, account, constants, customers, engineers, dashboard, jobs, users, customerjobhistory,invoices,main, menubar, navbar, socket, util, custom_carousel
  ]).
  component('applogix', AppComponent).
  config(routeConfig).
  run(function ($rootScope, $location, Auth) {
    'ngInject';
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedIn(function (loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  }).name;

angular.bootstrap(document, ['applogix']);
export default root;