'use strict';

describe('Component: AddengineerComponent', function() {
  // load the controller's module
  beforeEach(module('heavyMetalServerApp.addengineer'));

  var AddengineerComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    AddengineerComponent = $componentController('addengineer', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
