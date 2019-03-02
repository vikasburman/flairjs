/**
 * @name AppDomainProxy
 * @description Proxy to AppDomain that is created inside other worker.
 * @example
 *  
 */
const AppDomainProxy = function(name, domains) {
    let isUnloaded = false;

    // shared communication channel between main and worker thread
    let channel = new SharedChannel((err) => {  // eslint-disable-line no-unused-vars
        throw new _Exception('RemoteError', err); // TODO:
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

            // unload
            channel.remoteCall('ad', 'unload').finally(() => {
                channel.close();
            });
        }
    };

    // assembly load context
    this.context = Object.freeze(new AssemblyLoadContextProxy('default', this, channel));

    // scripts
    this.loadScripts = (...scripts) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }
        return channel.remoteCall('ad', 'loadScripts', ...scripts);
    };
};
