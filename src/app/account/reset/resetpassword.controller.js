'use strict';
import * as properties from '../../../properties';

export default class ResetPasswordController {

    /*@ngInject*/
    constructor($http, $routeParams, $location, Auth) {
        Auth.logout();
        var me = this;
        this.$http = $http;
        this.$location = $location;
        this.reset_id = $routeParams.reset_id;
        $(".alert").hide();
        $(".scroll-to-top").click();
        this.showSuccessAlert = function () {
            $("#success-alert").fadeTo(3000, 500).slideUp(500, function () { window.location.href = "/login"; });
            $(".scroll-to-top").click();
        }
        this.showFailureAlert = function () {
            $("#failure-alert").fadeTo(3000, 500).slideUp(500, function () { });
            $("#failure-alert").fadeOut(500, function () {
            });
        }
    }
    resetPassword(form) {
        this.submitted = true;
        if (form.$valid) {
            if (this.confirmPassword == this.password) {
                this.$http.post(properties.reset_user_password, {
                    "token": this.reset_id,
                    "password": this.password
                }).then(response => {
                    if (response.status == 200) {
                        this.showSuccessAlert();
                    } else {
                        this.showFailureAlert();
                    }
                }, error => {
                    this.showFailureAlert();
                });
            } else {
                return;
            }
        }
    }

}
