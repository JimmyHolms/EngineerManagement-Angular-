'use strict';

import angular from 'angular';
const ngRoute = require('angular-route');

import routing from './customers.routes';
import addCustomer from './addcustomer';
import editCustomer from './editcustomer';
import customerlist from './customerlist';
import customerapproval from './customerapproval';
import customerprofile from './customerprofile';
import updatecustomerprofile from './updatecustomerprofile';
import postjobcustomer from './postjobcustomer';
import customerchangepassword from './customerchangepassword';
import registrationcustomer from './registrationcustomer';
export default angular.module('apologix.customers', [ngRoute, addCustomer,editCustomer,customerlist,customerapproval,customerprofile,updatecustomerprofile,postjobcustomer,customerchangepassword,registrationcustomer])
  .config(routing)
  .name;
