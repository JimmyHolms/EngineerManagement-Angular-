'use strict';

describe('Component: AddjobComponent', function() {
  // load the controller's module
  beforeEach(module('heavyMetalServerApp.addjob'));

  var AddjobComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    AddjobComponent = $componentController('addjob', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
