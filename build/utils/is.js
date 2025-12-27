"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFunction = exports.isBoolean = exports.isNotEmptyString = exports.isString = exports.isNumber = void 0;
function isNumber(value) {
    return Object.prototype.toString.call(value) === '[object Number]';
}
exports.isNumber = isNumber;
function isString(value) {
    return Object.prototype.toString.call(value) === '[object String]';
}
exports.isString = isString;
function isNotEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}
exports.isNotEmptyString = isNotEmptyString;
function isBoolean(value) {
    return Object.prototype.toString.call(value) === '[object Boolean]';
}
exports.isBoolean = isBoolean;
function isFunction(value) {
    return Object.prototype.toString.call(value) === '[object Function]';
}
exports.isFunction = isFunction;
