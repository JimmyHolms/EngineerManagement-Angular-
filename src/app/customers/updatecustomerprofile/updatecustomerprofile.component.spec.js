'use strict';

describe('Component: updatecustomerprofileComponent', function() {
  // load the controller's module

  beforeEach(module('heavyMetalServerApp.updatecustomerprofile'));

  var updatecustomerprofileComponent;
  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    updatecustomerprofileComponent = $componentController('updatecustomerprofile', {$scope: $scope});
     
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});


