'use strict';

describe('Component: registrationcustomerComponent', function() {
  // load the controller's module
  beforeEach(module('heavyMetalServerApp.registrationcustomer'));

  var registrationcustomerComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    registrationcustomerComponent = $componentController('registrationcustomer', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
