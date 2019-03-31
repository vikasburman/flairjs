/**
 * @name include
 * @description bring the required dependency
 * @example
 *  include(dep)
 * @params
 *  dep: string - dependency to be included
 *                NOTE: Dep can be of any type as defined for 'bring'
 *  globalVar: string - globally added variable name by the dependency
 *             NOTE: if dependency is a file and it emits a global variable, this should be name
 *                   of that variable and it will return that variable itself
 * @returns promise - that gets resolved with given dependency
 */ 
const _include = (dep, globalVar) => { 
    return new Promise((resolve, reject) => {
        if (typeof dep !== 'string') { reject(_Exception.InvalidArgument('dep')); return; }
        try {
            _bring([dep], (obj) => {
                if (!obj) {
                    reject(_Exception.OperationFailed(`Dependency could not be resolved. (${dep})`)); 
                    return;
                } else {
                    if (typeof obj === 'boolean' && typeof globalVar === 'string') { // was resolved w true, but not an object AND if global var is given to look at
                        obj = (isServer ? global[globalVar] : (isWorker ? WorkerGlobalScope[globalVar] : window[globalVar]));
                        if (!obj) {
                            reject(_Exception.OperationFailed(`Dependency object could not be located. (${dep})`)); 
                            return;
                        }
                    }
                }
                resolve(obj); // this may be resolved object OR object picked from global scope OR TRUE value
            });
        } catch (err) {
            reject(err);
        }
    });
};

// attach to flair
a2f('include', _include);
