"use strict";

const RESOURCE_MANAGER = function() {

  var resourceCache = {};

  const loadResource = (resourceKey, path, cb) => {
    throw "Not Implemented";
  };

  const loadImage = (resourceKey, path, cb) => {
    const img = new Image();
    img.addEventListener("load", () => {
      resourceCache[resourceKey] = img;
      return cb(undefined, resourceKey);
    });
    img.addEventListener("error", (e) => {
      return cb(e);
    });
    img.src = path;
  };

  const evictResource = (resourceKey) => {
    resourceCache[resourceKey] = undefined;
  };

  const evictAll = () => {
    resourceCache = {};
  };

  const getResource = (resourceKey) => {
    return resourceCache[resourceKey];
  };

  return {
    evictResource,
    evictAll,
    getResource,
    loadImage,
    loadResource,
  };

}();
