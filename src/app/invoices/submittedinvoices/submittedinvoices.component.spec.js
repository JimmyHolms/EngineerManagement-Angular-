'use strict';

describe('Component: submittedinvoicesComponent', function() {
  // load the controller's module
  
  beforeEach(module('heavyMetalServerApp.submittedinvoices'));

  var submittedinvoicesComponent;
  
  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    submittedinvoicesComponent = $componentController('submittedinvoices', {$scope: $scope});
     
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});


