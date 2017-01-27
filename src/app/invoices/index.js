'use strict';

import angular from 'angular';
const ngRoute = require('angular-route');

import routing from './invoices.routes';

import activeinvoices from './activeinvoices';

import paidinvoices from './paidinvoices';

import submittedinvoices from './submittedinvoices';
import approvedinvoices from './approvedinvoices';
import aprovedcustomerinvoices from './aprovedcustomerinvoices';

export default angular.module('applogix.invoices', [ngRoute, activeinvoices,paidinvoices,submittedinvoices,approvedinvoices,aprovedcustomerinvoices])
  .config(routing)
  .name;
