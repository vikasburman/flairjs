/**
 * @name utils
 * @description Helper functions exposed.
 * @example
 *  utils.<...>
 * @params
 * @returns
 */ 
const _utils = () => { };
_utils.forEachAsync = forEachAsync;
_utils.replaceAll = replaceAll;
_utils.splitAndTrim = splitAndTrim;
_utils.findIndexByProp = findIndexByProp;
_utils.findItemByProp = findItemByProp;
_utils.isArrowFunc = isArrow;
_utils.isASyncFunc = isASync;
_utils.sieve = sieve;
_utils.b64EncodeUnicode = b64EncodeUnicode;
_utils.b64DecodeUnicode = b64DecodeUnicode;

// attach to flair
a2f('utils', _utils);
