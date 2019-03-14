const { IBootware } = ns('flair.boot');
const { BootHandler } = ns('flair.boot');

/**
 * @name Bootware
 * @description Bootware base class
 */
$$('abstract');
$$('ns', '(auto)');
Class('(auto)', [IBootware, BootHandler], function() {
});
