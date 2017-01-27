
/*
* @Summary AppComponent is the root component that other components will be housed
* */

const AppComponent = {
  template: `<div>
              <navbar></navbar>
              <menubar></menubar>
              <div ng-view=""></div>
            </div>`
};

export default AppComponent;
