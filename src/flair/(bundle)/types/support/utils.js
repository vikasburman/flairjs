/**
 * @name utils
 * @description Helper functions exposed.
 * @example
 *  utils.<...>
 */ 
const _utils = () => { };
_utils.guid = guid;
_utils.stuff = stuff;
_utils.replaceAll = replaceAll;
_utils.splitAndTrim = splitAndTrim;
_utils.findIndexByProp = findIndexByProp;
_utils.findItemByProp = findItemByProp;
_utils.which = which;
_utils.isArrowFunc = isArrow;
_utils.isASyncFunc = isASync;
_utils.sieve = sieve;
_utils.deepMerge = deepMerge;
_utils.getLoadedScript = getLoadedScript;
_utils.b64EncodeUnicode = b64EncodeUnicode;
_utils.b64DecodeUnicode = b64DecodeUnicode;
_utils.lens = lens;
_utils.globalSetting = globalSetting;

// attach to flair
a2f('utils', _utils);
