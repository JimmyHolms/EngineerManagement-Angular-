'use strict';

describe('Component: customerchangepasswordComponent', function() {
  // load the controller's module

  beforeEach(module('heavyMetalServerApp.updatecustomerprofile'));

  var customerchangepasswordComponent;
  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    customerchangepasswordComponent = $componentController('customerchangepassword', {$scope: $scope});
     
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});


