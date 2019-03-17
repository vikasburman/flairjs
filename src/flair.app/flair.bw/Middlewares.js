const { Bootware } = ns('flair.boot');

/**
 * @name Middlewares
 * @description Express Middleware Configurator
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('Express Middlewares', true); // mount specific
    };

    $$('override');
    this.boot = async (mount) => {
        // middleware information is defined at: https://expressjs.com/en/guide/using-middleware.html#middleware.application
        // each item is: { module: '', func: '', 'args': []  }
        // module: module name of the middleware, which can be required
        // func: if middleware has a function that needs to be called for configuration, empty if required object itself is a function
        // args: an array of args that need to be passed to this function or middleware function
        //       Note: In case a particular argument setting is a function - define the function code as an arrow function string with a 'return prefix' and it will be loaded as function
        //       E.g., setHeaders in https://expressjs.com/en/4x/api.html#express.static is a function
        //       define it as: "return (res, path, stat) => { res.set('x-timestamp', Date.now()) }"
        //       this string will ne passed to new Function(...) and returned values will be used as value of option
        //       all object type arguments will be scanned for string values that start with 'return ' and will be tried to convert into a function
        let middlewares = settings[`${mount.name}-middlewares`];
        if (middlewares && middlewares.length > 0) {
            let mod = null,
                func = null;
            for(let middleware of middlewares) {
                if (middleware.module) {
                    try {
                        // get module
                        mod = require(middleware.name);

                        // get func
                        if (middleware.func) {
                            func = mod[middleware.func];
                        } else {
                            func = mod;
                        }

                        // process args
                        let args = [],
                            argValue = null;
                        middleware.args = middleware.args || [];
                        for (let arg of middleware.args) {
                            if (typeof arg === 'string' && arg.startsWith('return ')) { // note a space after return
                                argValue = new Function(arg)();
                            } else if (typeof arg === 'object') {
                                for(let prop in arg) {
                                    if (arg.hasOwnProperty(prop)) {
                                        argValue = arg[prop];
                                        if (typeof argValue === 'string' && argValue.startsWith('return ')) { // note a space after return
                                            argValue = new Function(arg)();
                                            arg[prop] = argValue;
                                        }
                                    }
                                }
                            } else {
                                argValue = arg;
                            }
                            args.push(argValue);
                        }

                        // add middleware
                        mount.app.use(func(...args));
                    } catch (err) {
                        throw Exception.OperationFailed(`Middleware ${middleware.module} load failed.`, err, this.boot);
                    }
                }
            }
        }
    };
});
