'use strict';

describe('Component: AddCustomerComponent', function() {
  // load the controller's module
  beforeEach(module('heavyMetalServerApp.addcustomer'));

  var AddcustomerComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    AddcustomerComponent = $componentController('addcustomer', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
