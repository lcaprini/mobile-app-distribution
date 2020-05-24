/* eslint-disable no-extend-native */
'use strict';

// Prototype for Array contains
Array.prototype.contains = function(element) {
    return this.indexOf(element) > -1;
};
