'use strict';

describe('Component: activeinvoicesComponent', function() {
  // load the controller's module
  
  beforeEach(module('heavyMetalServerApp.activeinvoices'));

  var activeinvoicesComponent;
  
  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    activeinvoicesComponent = $componentController('activeinvoices', {$scope: $scope});
     
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});


