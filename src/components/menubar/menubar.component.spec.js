'use strict';

describe('Component: menubar', function() {
  // load the component's module
  beforeEach(module('directives.menubar'));

  var menubarComponent;

  // Initialize the component and a mock scope
  beforeEach(inject(function($componentController) {
    menubarComponent = $componentController('menubar', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
