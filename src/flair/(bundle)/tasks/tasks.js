/**
 * @name Tasks
 * @description Task execution
 * @example
 *  new Tasks.TaskInfo(qualifiedName, ...args)
 *  Tasks.invoke(task, progressListener)
 *  Tasks.getHandle(task, progressListener) -> handle
 *      handle.run(...args) // (can be executed many times)
 *      handle.close() // finally close
 *  Tasks.parallel.invoke.any(...tasks)
 *  Tasks.parallel.invoke.all(...tasks)
 *  Tasks.parallel.invoke.each(onSuccess, onError, ...tasks)
 *  Tasks.sequence.invoke(...tasks)
 * @params
 *  qualifiedName: string - qualified type name whose reference is needed
 * @returns {object} - if assembly which contains this type is loaded, it will return flair type object OR will return null
 */
const max_pool_size = (options.env.cores * 4);
const min_pool_size = Math.round(max_pool_size/4);
const ADPool = [];
const resetADPool = () => { // called by shared channel, whenever some AD goes idle
    if (ADPool.length <= min_pool_size) { return; } // not needed
    
    // take one pass to unload all domains which are not busy
    let allADs = ADPool.slice(0);
    let processNext = () => {
        if (allADs.length !== 0) { // unload idle sitting ad
            let ad = allADs.shift();
            if (!ad.context.isBusy()) { 
                ad.context.hasActiveInstances().then((count) => {
                    if (count === 0) { // idle ad
                        ad.unload(); // unload
                        ADPool.shift(); // remove from top from main pool
                        if (ADPool.length > min_pool_size) { // do more, if need be
                            processNext();
                        }
                    } else {
                        processNext();
                    }
                }).catch(() => {
                    // ignore error
                    processNext();
                });
            } else {
                processNext();
            }
        } 
    };
    processNext();

};
const getFreeAD = async () => {
    // get a free AD from pool
    // a free AD is whose default context does not have any open messages and instances count is zero
    let ad = null;
    if (!ADPool.length === 0) {
        for (let thisAD of ADPool) {
            if (!thisAD.context.isBusy()) { 
                if (await thisAD.context.hasActiveInstances() === 0) {
                    ad = thisAD;
                    break;
                }
            }
        }
    }
    if (!ad) { // none free could be found
        if (ADPool.length >= max_pool_size) { throw _Exception.OperationFailed('AppDomain pool limit reached.'); }
        ad = await _AppDomain.createDomain(guid()); // with a random name
    }
    return ad;
};

const _Tasks = { 
    TaskInfo: function(qualifiedName, ...args) {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', _Tasks.TaskInfo); }
        return Object.freeze({
            type: qualifiedName,
            typeArgs: args
        });
    },

    getHandle: async (task, progressListener) => {
        let ad = await getFreeAD();
        let taskHandle = {
            run: async (...args) => {
                return await ad.context.execute({
                    type: task.type,
                    typeArgs: task.typeArgs,
                    func: 'run',
                    args: args,
                    keepAlive: true
                }, progressListener);
            },
            close: async () => {
                try {
                    return ad.context.execute({
                        type: task.type,
                        typeArgs: task.typeArgs,
                        func: '',   // keeping it empty together with keepAlive = false, removes the internal instance
                        args: [],
                        keepAlive: false
                    }, progressListener);
                } finally {
                    resetADPool();
                }
            }
        };
        return taskHandle;
    },

    invoke: async (task, progressListener) => {
        let ad = await getFreeAD();
        try {
            return await ad.context.execute({
                type: task.type,
                typeArgs: task.typeArgs,
                func: 'run',
                args: [],
                keepAlive: false
            }, progressListener);
        } finally {
            resetADPool();
        }
    },

    parallel: Object.freeze({
        invokeMany: (...tasks) => {
            let promises = [];
            for(let task of tasks) {
                promises.push(_Tasks.invoke(task));
            }
            return promises;
        },   
        invoke: Object.freeze({
            any: (...tasks) => { return Promise.race(_Tasks.parallel.invokeMany(...tasks)); },
            all: (...tasks) => { return Promise.all(_Tasks.parallel.invokeMany(...tasks)); },
            each: (onSuccess, onError, ...tasks) => {
                return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                    let promises = _Tasks.parallel.invokeMany(...tasks),
                        done = 0;
                    for(let p of promises) {
                        p.then(onSuccess).catch(onError).finally(() => {
                            done++;
                            if (promises.length === done) {
                                resolve();
                            }
                        })
                    }
                });
            }
        })
    }),

    sequence: Object.freeze({
        invoke: async (...tasks) => {
            let results = [];
            for (let task of tasks) {
                results.push(await _Tasks.invoke(task));
            }
            return results;
        }
    })
};

// attach to flair
a2f('Tasks', _Tasks, () => {
    // unload pooled ADs
    ADPool.forEach((ad) => {
        ad.unload();
    });

    // clear pool
    ADPool.length = 0;
});
