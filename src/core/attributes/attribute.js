// Attribute
oojs.Attribute = oojs.Class('Attribute', function() {
    let decoratorFn = null;
    this.func('constructor', (...args) => {
        // args can be static or dynamic or settings
        // static ones are defined just as is, e.g.,
        //  ('text', 012, false, Reference)
        // dynamic ones are defined as special string
        //  ('[publicPropOrFuncName]', 012, false, Reference)
        // when string is defined as '[...]', this argument is replaced by a 
        // function which can be called (with binded this) to get dynamic value of the argument
        // the publicPropName is the name of a public property or function
        // name of the same object where this attribute is applied
        // settings ones are defined as another special string
        this.args = [];
        for(let arg of args) {
            if (typeof arg === 'string') {
                if (arg.startsWith('[') && arg.endsWith(']')) {
                    let fnName = arg.replace('[', '').replace(']', ''),
                        fn = function() {
                            let member = this[fnName]; // 'this' would change because of binding call when this function is called
                            if (typeof member === 'function') {
                                return member();
                            } else {
                                return member;
                            }
                        };
                        this.args.push(fn);
                } else {
                    this.args.push(arg);
                }
            } else {
                this.args.push(arg);
            }
        }
    });
    this.prop('args', []);
    this.func('decorator', (fn) => {
        if (typeof fn === 'function') {
            decoratorFn = fn;
        }
        return decoratorFn;
    });
    this.func('resetEventInterface', (source, target) => {
        target.subscribe = source.subscribe;
        target.unsubscribe = source.unsubscribe;
        delete source.subscribe;
        delete source.unsubscribe;
    });
});
