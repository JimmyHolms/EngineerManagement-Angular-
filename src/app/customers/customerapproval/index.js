'use strict';
import CustomerApprovalComponent from './customerapproval.component';

export default angular.module('apologix.customerapproval', ['ngResource'])
  .controller('CustomerApprovalComponent', CustomerApprovalComponent)
  .name;
