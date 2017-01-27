'use strict';

describe('Component:postjobcustomerComponent', function() {
  // load the controller's module
  beforeEach(module('heavyMetalServerApp.postjobcustomer'));

  var postjobcustomerComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
   postjobcustomerComponent = $componentController('postjobcustomer', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
