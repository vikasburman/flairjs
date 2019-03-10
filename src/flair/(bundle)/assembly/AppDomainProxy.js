/**
 * @name AppDomainProxy
 * @description Proxy to AppDomain that is created inside other worker.
 * @example
 *  
 */
const AppDomainProxy = function(name, domains, allADOs) {
    let isUnloaded = false,
        contextProxies = {};

    // shared communication channel between main and worker thread
    let channel = new SharedChannel(allADOs, (err) => {  // eslint-disable-line no-unused-vars
        throw _Exception.OperationFailed('Remote operation failed.', err); 
    });

    // app domain
    this.name = name;
    this.isRemote = true;
    this.isUnloaded = () => { return isUnloaded; };
    this.unload = () => {
        // this initiates unloading of secondary thread
        if (!isUnloaded) {
            // mark unloaded
            isUnloaded = true;

            // remove from domains list
            delete domains[name];

            // clear list
            contextProxies = {};

            // unload
            channel.remoteCall('ad', '', false, 'unload').finally(() => {
                channel.close();
            });
        }
    };

    // assembly load context
    this.context = Object.freeze(new AssemblyLoadContextProxy('default', this, channel));
    this.contexts = (name) => { return contextProxies[name] || null; }    
    this.createContext = (name) => {
        return new Promise((resolve, reject) => {
            if(typeof name !== 'string' || (name && name === 'default') || contextProxies[name]) { reject(_Exception.InvalidArguments('name')); return; }
            channel.remoteCall('ad', '', false, 'createContext', [name]).then((state) => {
                if (state) { // state is true, if context was created
                    let alcp = Object.freeze(new AssemblyLoadContextProxy(name, this, channel));
                    contextProxies[name] = alcp;
                    resolve(alcp);
                } else {
                    reject(_Exception.OperationFailed('Context could not be created.'));
                }
            }).catch(reject);
        });
    };

    // scripts
    this.loadScripts = (...scripts) => {
        if (this.isUnloaded()) { throw _Exception.InvalidOperation(`AppDomain is already unloaded. (${this.name})`, this.loadScripts); }
        return channel.remoteCall('ad', '', false, 'loadScripts', scripts);
    };
};
