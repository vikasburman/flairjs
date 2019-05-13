/**
 * @name SharedChannel
 * @description Shared channel that communicates between two threads.
 */
const SharedChannel = function(allADOs, onError) { 
    let openMessages = {}, // {id: messageId, promise: promise }
        openMessagesCount = 0,
        channelPort = null,
        wk = null;     

    // NOTE: This function's script is loaded independently by worker thread constructor as text/code.
    const remoteMessageHandler = function() {
        let isServer = ('<<{{isServer}}>>' === 'true' ? true : false), // eslint-disable-line no-constant-condition
            port = null;
        // let ados = JSON.parse('<<{{ados}}>>');

        // build communication pipeline between main thread and worker thread
        const onMessageFromMain = (e) => { // message received from main thread
            let funcName = e.data.func,
                func = null;
            const postSuccessToMain = (data) => {
                port.postMessage({
                    data: {
                        id: e.data.id,
                        isComplete: true,
                        isError: false,
                        error: null,
                        ctx: e.data.ctx,
                        result: (e.data.returnsAsIs ? data : (data ? true : false))
                    }
                }); 
            };
            const postProgressToMain = (progressData) => {
                port.postMessage({
                    data: {
                        id: e.data.id,
                        isComplete: false,
                        isError: false,
                        error: null,
                        ctx: e.data.ctx,
                        result: progressData
                    }
                }); 
            };            
            const postErrorToMain = (err) => {
                port.postMessage({
                    data: {
                        id: e.data.id,
                        isComplete: true,
                        isError: true,
                        error: (err ? err.toString() : 'UnknownError'),
                        ctx: e.data.ctx,
                        result: null
                    }
                });  
            };
            const runFunction = () => {
                try {
                    // special case
                    if (e.data.obj === 'alc' && funcName === 'execute') {
                        e.data.args.push((e) => { // progressListener
                            postProgressToMain(e.args);
                        });
                    }
                    let result = func(...e.data.args);
                    if (result && typeof result.then === 'function') {
                        result.then(postSuccessToMain).catch(postErrorToMain);
                    } else {
                        postSuccessToMain(result);
                    }
                } catch (err) {
                    postErrorToMain(err);
                }
            };    

            // run
            switch(e.data.obj) {
                case 'ad': func = AppDomain[funcName]; runFunction(); break;
                case 'alc': func = AppDomain.contexts(e.data.name)[funcName]; runFunction(); break;
            }
        };

        // initialize environment
        if (isServer) {
            // load entry point
            require('<<{{entryPoint}}>>');

            // plumb to parent port for private port connection
            let parentPort = require('worker_threads').parentPort;
            port = parentPort;
            parentPort.once('message', (value) => {
                port = value.privatePort;
                port.on('message', onMessageFromMain);
            });
        } else {
            // load requirejs and entry point
            importScripts('<<{{requirejs}}>>', '<<{{entryPoint}}>>');

            // plumb to private port 
            port = this;
            port.onmessage = onMessageFromMain;
        }
    };
    let remoteMessageHandlerScript = remoteMessageHandler.toString().replace('<<{{entryPoint}}>>', AppDomain.entryPoint());
    remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<{{requirejs}}>>', which(settings.requirejs, true)); // dev/min file
    remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<{{isServer}}>>', isServer.toString());
    // remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<{{ados}}>>', JSON.stringify(allADOs));
    remoteMessageHandlerScript = `(${remoteMessageHandlerScript})();`
    // NOTE: script/end

    const postMessageToWorker = (objId, name, returnsAsIs, func, args, ctx, progressListener) => { // async message sent to worker thread
        return new Promise((resolve, reject) => {
            // store message for post processing handling
            let messageId = guid();
            openMessages[messageId] = {
                resolve: resolve,
                reject: reject,
                progressListener: progressListener
            };
            openMessagesCount++;
            
            // post message to worker
            wk.postMessage({
                data: {
                    id: messageId,
                    obj: objId,
                    name: name,
                    returnsAsIs: returnsAsIs,
                    ctx: ctx || {},
                    func: func,
                    args: ((args && Array.isArray(args)) ? args : [])
                }
            });
        });
    };
    const onMessageFromWorker = (e) => { // async response received from worker thread
        if (openMessages[e.data.id]) {
            // pick message
            let msg = openMessages[e.data.id];

            if (e.data.isComplete) { // done
                delete openMessages[e.data.id];
                openMessagesCount--;

                // resolve/reject 
                if (e.data.isError) {
                    msg.reject(e.data.error);
                } else {
                    msg.resolve(Object.freeze({
                        ctx: e.data.ctx,
                        result: e.data.result
                    }));
                }
            } else { // progress
                if (typeof progressListener === 'function' && msg.progressListener) {
                    // should match with Dispatcher's dispatch event style of passing data
                    setTimeout(() => { msg.progressListener(Object.freeze({ host: (e.data.ctx._ ? e.data.ctx._.host : ''), name: 'progress', args: e.data.result })); }, 0); // <-- event handler will receive this
                }
            }
        } else { // unsolicited message
            onError(`Unknown operation is not supported. (${e.data.id})`);
        }
    };

    // create new worker
    if (isServer) {
        const { Worker, MessageChannel } = require('worker_threads');
        wk = new Worker(remoteMessageHandlerScript, {
            eval: true,
            workerData: {
                argv: process.argv
            }
        });

        // create private channel
        const subChannel = new MessageChannel();
        wk.postMessage({ privatePort: subChannel.port1 }, [subChannel.port1])
        subChannel.port2.on('error', onError);
        subChannel.port2.on('message', onMessageFromWorker);
    } else { // client
        let blob = new Blob([remoteMessageHandlerScript]),
            blobURL = window.URL.createObjectURL(blob, {
                type: 'application/javascript; charset=utf-8'
            });
        wk = new window.Worker(blobURL);
        wk.onmessage = onMessageFromWorker;
        wk.onerror = onError;
    }

    // run something in worker thread
    this.remoteCall = postMessageToWorker;

    // close channel
    this.close = () => {
        if (isServer) { 
            channelPort.close(); 
            wk.unref();
        }
        wk.terminate();
    };

    // state
    this.isBusy = () => { return openMessagesCount; }
};
