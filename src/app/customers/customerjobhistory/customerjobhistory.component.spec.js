'use strict';

describe('Component: customerjobhistoryComponent', function() {
  // load the controller's module
  beforeEach(module('agfullstackApp.customerjobhistory'));

  var customerjobhistoryComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    customerjobhistoryComponent = $componentController('customerjobhistory', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
