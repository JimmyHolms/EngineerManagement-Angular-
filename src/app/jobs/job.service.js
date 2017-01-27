'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JobResource = JobResource;
function JobResource() {
  var savedData = {};

  function set(data) {
    savedData = data;
  }
  function get() {
    return savedData;
  }

  return {
    set: set,
    get: get
  };
}
