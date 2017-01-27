'use strict';
import * as properties from '../properties';
const angular = require('angular');
function setCorrectImagePath(src) {
    if (src!=null || !src.includes("http")) {
        return "http://" + src;
    }
    return src;
}
function setCorrectPhotoPath(path){
    if(path!=null && path.includes(".com")){
      return path;
    }
    return properties.baseUrl + "/" + path;
}
function ReadableAddress(AddressObject) {
    var jobAddress;
    if (angular.isUndefined(AddressObject.site_name)) return '';
    jobAddress = angular.isUndefined(AddressObject.site_name) ? '' : AddressObject.site_name;
    jobAddress += angular.isUndefined(AddressObject.street_address) ? '' : ', ' + AddressObject.street_address;
    jobAddress += angular.isUndefined(AddressObject.city) ? '' : ', ' + AddressObject.city;
    jobAddress += angular.isUndefined(AddressObject.state) ? '' : ', ' + AddressObject.state;
    jobAddress += angular.isUndefined(AddressObject.zip_code) ? '' : ', ' + AddressObject.zip_code;
    jobAddress += angular.isUndefined(AddressObject.country) ? '' : ', ' + AddressObject.country;
    jobAddress += angular.isUndefined(AddressObject.phone_number) ? '' : ', ' + AddressObject.phone_number;
    return jobAddress;
}
function makeImageMultiFormData(filearray) {
    //var data = new FormData();
    //data.append("upload_image",new Blob([this.$scope.fileArray[0].fileContent],{ type:this.$scope.fileArray[0].contentType}) );
    //data.append("upload_image",this.$scope.fileArray[0].fileContent,{ type:this.$scope.fileArray[0].contentType});
    var formdata = "";
    for (var i = 0; i < filearray.length; i++) {
        formdata += "--" + properties.boundary + '\r\n';
        formdata += "Content-Disposition: form-data;";
        formdata += "filename=" + filearray[i].filename + ";";
        formdata += "modification-date=" + filearray[i].lastModifiedDate + ";";
        formdata += "size=" + filearray[i].size + ";";
        formdata += "name=" + "upload_image";
        formdata += '\r\n';
        formdata += "Content-Type:";
        formdata += filearray[i].contentType;
        formdata += '\r\n\r\n';
        formdata += filearray[i].fileContent;
        formdata += '\r\n';
        formdata += "--" + properties.boundary + '--\r\n';
    }
    return formdata;
}
export {setCorrectImagePath, ReadableAddress , makeImageMultiFormData , setCorrectPhotoPath}