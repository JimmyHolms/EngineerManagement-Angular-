'use strict';
const angular = require('angular');
import * as properties from '../../../properties';

export default class ManageCategoryComponent {
    constructor($http) {
        this.$http = $http;
        this.categories = [];
        this.isReadOnlyScreen = true;
        this.isEdit = false;
        this.submitted = false;
        this.childcategoryvalidate = false;
        this.currentCategory = {};
        this.currentCategory.child_categories = [];
        this.getCategories();
        $(".alert").hide();   //Hides all the BS alerts on the page
        $(".scroll-to-top").click();
        this.showDeleteSuccessAlert = function () {
            $("#success-delete-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-delete-alert").slideUp(500); });
            $(".scroll-to-top").click();
        }
        this.showAddSuccessAlert = function () {
            $("#success-add-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-add-alert").slideUp(500); });
            $(".scroll-to-top").click();
        }
        this.showAddFailureAlert = function () {
            $("#failure-add-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-add-alert").slideUp(500); });
            $(".scroll-to-top").click();
        }
        this.showUpdateSuccessAlert = function () {
            $("#success-update-alert").fadeTo(3000, 500).slideUp(500, function () { $("#success-update-alert").slideUp(500); });
            $(".scroll-to-top").click();
        }
        this.showUpdateFailureAlert = function () {
            $("#failure-update-alert").fadeTo(3000, 500).slideUp(500, function () { $("#failure-update-alert").slideUp(500); });
            $(".scroll-to-top").click();
        }
    }
    getCategories() {
        this.$http.get(properties.category_path).then(response => {
            if (response.status == 200) {
                this.categories = response.data.categories;
            }
        });
    }
    showChildCategories(category) {
        var result = "";
        if (!angular.isArray(category.child_categories)) return result;
        var length = category.child_categories.length;
        for (var i = 0; i < length; i++) {
            if (i != 0) {
                result += " , ";
            }
            result += category.child_categories[i];
        }
        return result;
    }
    deleteCategory(id) {
        this.$http.delete(properties.category_path + "/" + id).then(response => {
            if (response.status == 204) {
                this.showDeleteSuccessAlert();
                this.getCategories();
            } else {

            }
        });
    }
    editCategory(category) {
        this.isReadOnlyScreen = false;
        this.isEdit = true;
        this.currentCategory = category;
    }
    addCategory() {
        this.isReadOnlyScreen = false;
        this.isEdit = false;
    }
    addSubCategory() {
        if (angular.isArray(this.currentCategory.child_categories)) {
            this.currentCategory.child_categories.push(this.addSubCategoryName);
        }
        this.addSubCategoryName = "";
    }
    uploadData(form) {
        this.submitted = true;
        var child_categories = this.currentCategory.child_categories;
        if (angular.isArray(child_categories) && (child_categories.length > 0)) {
            this.childcategoryvalidate = true;
        }
        if (form.$valid && this.childcategoryvalidate) {
            if (this.isEdit) {
                this.$http.put(properties.category_path + "/" + this.currentCategory._id, this.currentCategory).then(response => {
                    if (response.status == 200) {
                        this.showUpdateSuccessAlert();
                        this.getCategories();
                    } else {
                        this.showUpdateFailureAlert();
                    }
                });
            } else {
                this.$http.post(properties.category_path, this.currentCategory).then(response => {
                    if (response.status == 201) {
                        this.showAddSuccessAlert();
                        this.getCategories();
                    } else {
                        this.showAddFailureAlert();
                    }
                });
            }
            this.isReadOnlyScreen = true;
            this.currentCategory = {};
            this.currentCategory.child_categories = [];
        }
    }
    removeSubCategory(index) {
        if (index != -1)
            this.currentCategory.child_categories.splice(index, 1);
    }
    cancel() {
        this.isReadOnlyScreen = true;
        this.currentCategory = {};
        this.currentCategory.child_categories = [];
    }
}