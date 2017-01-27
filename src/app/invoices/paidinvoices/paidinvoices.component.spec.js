'use strict';

describe('Component: paidinvoicesComponent', function() {
  // load the controller's module
  
  beforeEach(module('heavyMetalServerApp.paidinvoices'));

  var paidinvoicesComponent;
  
  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    paidinvoicesComponent = $componentController('paidinvoices', {$scope: $scope});
     
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});


