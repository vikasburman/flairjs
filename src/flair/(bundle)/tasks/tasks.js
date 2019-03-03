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
 * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
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
const getFreeAD = () => {
    return new Promise((resolve, reject) => {
        // get a free AD from pool
        // a free AD is whose default context does not have any open messages and instances count is zero
        let allADs = ADPool.slice(0);
        let processNext = () => {
            if (allADs.length !== 0) { // find a free sitting ad
                let ad = allADs.shift();
                if (!ad.context.isBusy()) { 
                    ad.context.hasActiveInstances().then((count) => {
                        if (count === 0) {
                            resolve(ad);
                        } else {
                            processNext();
                        }
                    }).catch(reject);
                } else {
                    processNext();
                }
            } else {
                if (ADPool.length < max_pool_size) { // create new ad
                    _AppDomain.createDomain(guid()).then((ad) => { // with a random name
                        resolve(ad);
                    }).catch(reject);
                } else { 
                    reject('AD POOL FULL'); // TODO: send proper error
                }
            }
        };
        processNext();
    });
};

const _Tasks = { 
    TaskInfo: function(qualifiedName, ...args) {
        return Object.freeze({
            type: qualifiedName,
            typeArgs: args
        });
    },

    getHandle: (task, progressListener) => {
        return new Promise((resolve, reject) => {
            getFreeAD().then((ad) => {
                let taskHandle = {
                    run: (...args) => {
                        return new Promise((_resolve, _reject) => {
                            ad.context.execute({
                                type: task.type,
                                typeArgs: task.typeArgs,
                                func: 'run',
                                args: args,
                                keepAlive: true
                            }, progressListener).then(_resolve).catch(_reject); 
                        });
                    },
                    close: () => {
                        return new Promise((_resolve, _reject) => {
                            ad.context.execute({
                                type: task.type,
                                typeArgs: task.typeArgs,
                                func: '',   // keeping it empty together with keepAlive = false, removes the internal instance
                                args: [],
                                keepAlive: false
                            }, progressListener).then(_resolve).catch(_reject).finally(resetADPool); 
                        });
                    }
                };
                resolve(taskHandle);
            }).catch(reject);
        });
    },

    invoke: (task, progressListener) => {
        return new Promise((resolve, reject) => {
            getFreeAD().then((ad) => {
                ad.context.execute({
                    type: task.type,
                    typeArgs: task.typeArgs,
                    func: 'run',
                    args: [],
                    keepAlive: false
                }, progressListener).then(resolve).catch(reject).finally(resetADPool)
            }).catch(reject);
        });
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
        invoke: (...tasks) => {
            return new Promise((resolve, reject) => {
                let allTasks = tasks.slice(0),
                    results = [];
                let processNext = () => {
                    if (allTasks.length === 0) { resolve(...results); return; }
                    let task = allTasks.shift();
                    _Tasks.invoke(task).then((result) => {
                        results.push(result);
                        processNext();
                    }).catch(reject);
                };
                if (allTasks.length > 0) { 
                    processNext(); 
                } else {
                    resolve(...results);
                }
            });
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
