'use strict';

export default class LoginController {

  /*@ngInject*/
  constructor(Auth, $location) {
    this.Auth = Auth;
     
    this.$location = $location;
     $(".alert").hide(); 
        this.showFailureAlert = function () {
      $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-alert").slideUp(500); });
      $(".scroll-to-top").click();
    } 
  }

  login(form) {
    this.submitted = true;

    if (form.$valid) {
      this.Auth.login({
          email: this.operator.email,
          password: this.operator.password
        })
        .then(() => {
          // Logged in, redirect to home
          this.$location.path('/dashboard');
        })
          .catch(err => {
          this.Auth.customerlogin({
          email: this.operator.email,
          password: this.operator.password
        })
        .then( ()=>{
         
          // Logged in, redirect to home
        this.$location.path('/customerjobhistory');
        })
        .catch(err => {
        
            this.showFailureAlert();
         //this.errors.login = err.message;
        });
         // this.errors.login = err.message;
        });
    }
  }
}
