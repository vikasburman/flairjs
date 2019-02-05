let _attr = (name, ...args) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }

    let Attr = null;
    if (typeof name === 'string') {
        Attr = flair.Container(name); // gets the first one
    } else {
        Attr = name;
        name = Attr._.name;
    }

    // push in its own bucket
    _attr.bucket.push({name: name, Attr: Attr, args: args});
};
_attr.bucket = [];
_attr.collect = () => {
    let attrs = _attr.bucket.slice();
    _attr.clear();
    return attrs;
}
_attr.has = (name) => {
    return (_attr.bucket.findIndex(item => item.name === name) !== -1);
};
_attr.clear = () => {
    _attr.bucket.length = 0; // remove all
};
