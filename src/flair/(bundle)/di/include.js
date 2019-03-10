/**
 * @name include
 * @description bring the required dependency
 * @example
 *  include(dep)
 * @params
 *  dep: string - dependency to be included
 *                NOTE: Dep can be of any type as defined for 'bring'
 * @returns promise - that gets resolved with given dependency
 */ 
const _include = (dep) => { 
    return new Promise((resolve, reject) => {
        if (typeof dep !== 'string') { reject(_Exception.InvalidArgument('dep')); return; }
        try {
            _bring([dep], (obj) => {
                if (obj) {
                    resolve(obj);
                } else {
                    reject(_Exception.OperationFailed(`Dependency could not be resolved. (${dep})`));
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

// attach to flair
a2f('include', _include);
