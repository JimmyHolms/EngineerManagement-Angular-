'use strict';

describe('Component: AdduserComponent', function() {
  // load the controller's module
  beforeEach(module('heavyMetalServerApp.edituser'));

  var AdduserComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    AdduserComponent = $componentController('edituser', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
