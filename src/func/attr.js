/**
 * @name attr
 * @description Decorator function to apply attributes on type and member definitions
 * @example
 *  attr(attrName)
 *  attr(attrName, ...args)
 * @params
 *  attrName: string - Name of the attribute, it can be an internal attribute or a DI container registered attribute name
 *  args: any - Any arguments that may be needed by attribute
 * @returns void
 */ 
const _attr = (name, ...args) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }

    let Attr = null;
    if (typeof name === 'string') {
        Attr = flair.Container(name); // gets the first one
    } else {
        Attr = name;
        name = Attr._.name;
    }

    // push in its own bucket
    _attr._.bucket.push({name: name, Attr: Attr, args: args});
};
_attr._ = Object.freeze({
    bucket: []
});
_attr.collect = () => {
    let attrs = _attr._.bucket.slice();
    _attr.clear();
    return attrs;
}
_attr.has = (name) => {
    return (_attr._.bucket.findIndex(item => item.name === name) !== -1);
};
_attr.clear = () => {
    _attr._.bucket.length = 0; // remove all
};

// attach
flair.attr = _attr;
flair.members.push('attr');