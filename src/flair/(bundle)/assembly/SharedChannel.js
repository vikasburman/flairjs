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
        let isServer = ('<<isServer>>' === 'true' ? true : false), // eslint-disable-line no-constant-condition
            ados = JSON.parse('<<ados>>'),
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
                        isComplete: true,
                        isError: false,
                        error: null,
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
                        result: null
                    }
                });  
            };

            // run
            switch(e.data.obj) {
                case 'ad': AppDomain[funcName]; break;
                case 'alc': AppDomain.contexts(e.data.name)[funcName]; break;
            }
            try {
                // special case
                if (e.data.obj === 'alc' && e.data.name === 'execute') {
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

        // initialize environment
        if (isServer) {
            // load flair
            flair = require('<<file>>');

            // plumb to parent port for private port connection
            let parentPort = require('worker_threads').parentPort;
            port = parentPort;
            parentPort.once('message', (value) => {
                port = value.privatePort;
                port.on('message', onMessageFromMain);
            });
        } else {
            // load flair
            _global.importScripts('<<file>>');
            flair = _global.flair;

            // plumb to private port 
            port = this;
            port.onmessage = onMessageFromMain;
        }
        AppDomain = flair.AppDomain;

        // load all preambles which were registered on main app domain at the time of creating new app domain
        if (ados.length !== 0) {
            AppDomain.registerAdo(...ados);
        }        
    };
    let remoteMessageHandlerScript = remoteMessageHandler.toString().replace('<<file>>', currentFile);
    remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<isServer>>', isServer.toString());
    remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<ados>>', JSON.stringify(allADOs));
    remoteMessageHandlerScript = `(${remoteMessageHandlerScript})();`
    // NOTE: script/end

    const postMessageToWorker = (objId, name, returnsAsIs, func, args, progressListener) => { // async message sent to worker thread
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
                    msg.resolve(e.data.result);
                }
            } else { // progress
                if (typeof progressListener === 'function' && msg.progressListener) {
                    // should match with Dispatcher's dispatch event style of passing data
                    setTimeout(() => { msg.progressListener({ name: 'progress', args: e.data.result }); }, 0); // <-- event handler will receive this
                }
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

    // state of open messages
    this.isBusy = () => { return openMessagesCount !== 0; }
};
