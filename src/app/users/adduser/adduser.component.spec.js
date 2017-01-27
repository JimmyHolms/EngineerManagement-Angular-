'use strict';

describe('Component: AdduserComponent', function() {
  // load the controller's module
  beforeEach(module('heavyMetalServerApp.adduser'));

  var AdduserComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    AdduserComponent = $componentController('adduser', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
