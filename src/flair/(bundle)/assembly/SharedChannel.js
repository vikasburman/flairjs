/**
 * @name SharedChannel
 * @description Shared channel that communicates between two threads.
 */
const SharedChannel = function(onError) { 
    let openMessages = {}, // {id: messageId, promise: promise }
        channelPort = null,
        wk = null;     

    // NOTE: This function's script is loaded independently by worker thread constructor as text/code.
    const remoteMessageHandler = function() {
        let isServer = ('<<isServer>>' === 'true' ? true : false), // eslint-disable-line no-constant-condition
            flair = null,
            port = null,
            AppDomain = null;

        // build communication pipeline between main thread and worker thread
        const onMessageFromMain = (e) => { // message received from main thread
            let funcName = e.data.func,
                func = null;
            const postSuccessToMain = (data) => {
                port.postMessage({
                    data: {
                        id: e.data.id,
                        isError: false,
                        error: null,
                        result: data
                    }
                }); 
            };
            const postErrorToMain = (err) => {
                port.postMessage({
                    data: {
                        id: e.data.id,
                        isError: true,
                        error: err,
                        result: null
                    }
                });  
            };

            // run
            switch(e.data.obj) {
                case 'ad': AppDomain[funcName]; break;
                case 'alc': AppDomain.context[funcName]; break;
            }
            try {
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

        // initialize environment
        if (isServer) {
            flair = require('<<file>>');
            let parentPort = require('worker_threads').parentPort;
            port = parentPort;
            parentPort.once('message', (value) => {
                port = value.privatePort;
                port.on('message', onMessageFromMain);
            });
        } else {
            _global.importScripts('<<file>>');
            flair = _global.flair;
            port = this;
            port.onmessage = onMessageFromMain;
        }
        AppDomain = flair.AppDomain;
    };
    let remoteMessageHandlerScript = remoteMessageHandler.toString().replace('<<file>>', currentFile);
    remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<isServer>>', isServer.toString());
    remoteMessageHandlerScript = `(${remoteMessageHandlerScript})();`
    // NOTE: script/end

    const postMessageToWorker = (objId, func, ...args) => { // async message sent to worker thread
        return new Promise((resolve, reject) => {
            // store message for post processing handling
            let messageId = guid();
            openMessages[messageId] = {
                resolve: resolve,
                reject: reject
            };
            
            // post message to worker
            wk.postMessage({
                data: {
                    id: messageId,
                    obj: objId,
                    func: func,
                    args: args
                }
            });
        });
    };
    const onMessageFromWorker = (e) => { // async response received from worker thread
        if (openMessages[e.data.id]) {
            // pick message
            let p = openMessages[e.data.id].promise;
            delete openMessages[e.data.id];

            // resolve/reject
            if (e.data.isError) {
                p.reject(e.data.error);
            } else {
                p.resolve(e.data.result);
            }
        } else { // unsolicited message
            onError(e.data); // TODO: fix - send proper error
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
            blobURL = _global.URL.createObjectURL(blob, {
                type: 'application/javascript; charset=utf-8'
            });
        wk = new _global.Worker(blobURL);
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
};
