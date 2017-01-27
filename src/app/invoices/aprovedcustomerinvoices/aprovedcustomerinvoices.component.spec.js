'use strict';

describe('Component: aprovedcustomerinvoicesComponent', function() {
  // load the controller's module
  
  beforeEach(module('heavyMetalServerApp.aprovedcustomerinvoices'));

  var aprovedcustomerinvoicesComponent;
  
  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    aprovedcustomerinvoicesComponent = $componentController('aprovedcustomerinvoices', {$scope: $scope});
     
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});


