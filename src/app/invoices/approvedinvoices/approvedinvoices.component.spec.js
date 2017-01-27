'use strict';

describe('Component: approvedinvoicesComponent', function() {
  // load the controller's module
  
  beforeEach(module('heavyMetalServerApp.approvedinvoices'));

  var submittedinvoicesComponent;
  
  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    submittedinvoicesComponent = $componentController('approvedinvoices', {$scope: $scope});
     
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});


