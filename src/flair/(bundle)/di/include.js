/**
 * @name include
 * @description bring the required dependency
 * @example
 *  include(dep)
 * @params
 *  dep: string - dependency to be included
 *                NOTE: Dep can be of any type as defined for 'bring'
 *  globalVar: string/boolean - globally added variable name by the dependency
 *             NOTE: if dependency is a file and it emits a global variable, this should be name
 *                   of that variable and it will return that variable itself
 *                   if dependency is a file and does not emit any variable and it is still ok to
 *                   assume it a valid scenario, pass true value and it will assume a successfull loading if there is no error occured
 * @returns promise - that gets resolved with given dependency
 */ 
const _include = (dep, globalVar) => { 
    return new Promise((resolve, reject) => {
        if (typeof dep !== 'string') { reject(_Exception.InvalidArgument('dep')); return; }
        try {
            _bring([dep], (obj) => {
                if (obj) {
                    resolve(obj);
                } else if (globalVar) { // if global var is given to look at
                    if (typeof globalVar === 'boolean') {
                        resolve(); // since a true is passed, resolve as is
                    } else {
                        if (options.global[globalVar]) {
                            resolve(options.global[globalVar]);
                        }
                    }
                }
                reject(_Exception.OperationFailed(`Dependency could not be resolved. (${dep})`));
            });
        } catch (err) {
            reject(err);
        }
    });
};

// attach to flair
a2f('include', _include);
