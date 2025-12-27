"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumber = isNumber;
exports.isString = isString;
exports.isNotEmptyString = isNotEmptyString;
exports.isBoolean = isBoolean;
exports.isFunction = isFunction;
function isNumber(value) {
    return Object.prototype.toString.call(value) === '[object Number]';
}
function isString(value) {
    return Object.prototype.toString.call(value) === '[object String]';
}
function isNotEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}
function isBoolean(value) {
    return Object.prototype.toString.call(value) === '[object Boolean]';
}
function isFunction(value) {
    return Object.prototype.toString.call(value) === '[object Function]';
}
