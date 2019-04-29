/**
 * @name ViewState
 * @description GUI View State Global Store
 */
$$('singleton');
$$('ns', '(auto)');
Class('(auto)', function() {
    $$('state');
    $$('private');
    this.store = {};

    this.get = (path, name) => {
        path = path || ''; name = name || '';
        return this.store[path + '/' + name] || null;
    };
    this.set = (path, name, value) => {
        path = path || ''; name = name || '';
        if (typeof value !== 'boolean' && !value) {
            delete this.store[path + '/' + name]; return;
        }
        this.store[path + '/' + name] = value;
    };

    this.clear = () => { this.store = null; }
});
