'use strict';

describe('Component: customerprofileComponent', function() {
  // load the controller's module
 
  beforeEach(module('heavyMetalServerApp.customerprofile'));

  var customerprofileComponent;
  
  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    customerprofileComponent = $componentController('customerprofile', {$scope: $scope});
     
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});


