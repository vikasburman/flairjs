/**
 * @preserve
 * <title>
 * <desc>
 * Version <version>
 * <datetime>
 * <copyright>
 * <license>
 * <link>
 */

// eslint-disable-next-line for-direction
(function(factory) { // eslint-disable-line getter-return
    'use strict';

    // module definition pattern
    <!-- inject: ./misc/_module.js -->

}).call((new Function("try {return global;}catch(e){return window;}"))(), (opts) => {
    'use strict';

    // reset everything and then proceed to set a clean environment
    let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
        _global = (isServer ? global : window);

    if(_global.flair) { 

        // reset logic
        <!-- inject: ./misc/_reset.js -->

        // special case (mostly for testing)
        if (typeof opts === 'string' && opts === 'END') { return; } // don't continue with reset
    }

    // environment
    if (!opts) { 
        opts = {}; 
    } else if (typeof opts === 'string') { // only symbols can be given as comma delimited string
        opts = { symbols: opts.split(',').map(item => item.trim()) };
    }

    // core support objects
    <!-- inject: ./misc/_exception.js -->
    <!-- inject: ./misc/_typeOf.js -->
    <!-- inject: ./misc/_is.js -->
    <!-- inject: ./misc/_args.js -->
    <!-- inject: ./misc/_attr.js -->

    // helper functions
    <!-- inject: ./misc/_helpers.js -->

    // primary type builder
    <!-- inject: ./misc/_builder.js -->

    let flair = { members: [] },
        noop = () => {},
        sym = (opts.symbols || []), // eslint-disable-next-line no-unused-vars
        noopAsync = (resolve, reject) => { resolve(); },
        _args = (isServer ? process.argv : new window.URLSearchParams(window.location.search)),
        isTesting = (sym.indexOf('TEST') !== -1),
        options = null;

    // forced server/client mocking for test environment
    if (isTesting) {
        if (sym.indexOf('SERVER') !== -1) { 
            isServer = true;
        } else if (sym.indexOf('CLIENT') !== -1) {
            isServer = false;
        }
    }

    // options definition
    <!-- inject: ./misc/_options.js -->

    // flair meta information
    flair._ = Object.freeze({
        name: '<title>',
        version: '<version>',
        copyright: '<copyright>',
        license: '<license>',
        link: '<link>',
        lupdate: new Date('<datetime>')
    });
    flair.info = flair._;
    flair.options = options;

    // exposed members
    <!-- inject: ./types/exception.js -->
    <!-- inject: ./types/args.js -->
    <!-- inject: ./types/attr.js -->
    <!-- inject: ./types/struct.js -->
    <!-- inject: ./assembly/assembly.js -->
    <!-- inject: ./assembly/namespace.js -->
    <!-- inject: ./assembly/types.js -->
    <!-- inject: ./types/class.js -->
    <!-- inject: ./types/mixin.js -->
    <!-- inject: ./types/interface.js -->
    <!-- inject: ./types/enum.js -->
    <!-- inject: ./types/proc.js -->
    <!-- inject: ./types/resource.js -->
    <!-- inject: ./func/using.js -->
    <!-- inject: ./func/as.js -->
    <!-- inject: ./func/typeOf.js -->
    <!-- inject: ./func/is.js -->
    <!-- inject: ./func/isDerivedFrom.js -->
    <!-- inject: ./func/isImplements.js -->
    <!-- inject: ./func/isInstanceOf.js -->
    <!-- inject: ./func/isMixed.js -->
    <!-- inject: ./di/container.js -->
    <!-- inject: ./attributes/attribute.js -->
    <!-- inject: ./attributes/async.js -->
    <!-- inject: ./attributes/deprecate.js -->
    <!-- inject: ./attributes/enumerate.js -->
    <!-- inject: ./di/include.js -->
    <!-- inject: ./di/inject.js -->
    <!-- inject: ./di/multiinject.js -->
    <!-- inject: ./aop/aspects.js -->
    <!-- inject: ./aop/aspect.js -->
    <!-- inject: ./serialization/serializer.js -->
    <!-- inject: ./reflection/reflector.js -->

    // expose to global environment
    if (!options.env.supressGlobals) {
        for(let name of flair.members) {
            _global[name] = Object.freeze(flair[name]);
        }
    }
    flair.members = Object.freeze(flair.members);
    _global.flair = Object.freeze(flair); // this is still exposed, so can be used globally

    // return
    return _global.flair;
});