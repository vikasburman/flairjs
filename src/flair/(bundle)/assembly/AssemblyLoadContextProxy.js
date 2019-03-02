/**
 * @name AssemblyLoadContextProxy
 * @description Proxy of the AssemblyLoadContext that is created inside other AppDomain.
 */
const AssemblyLoadContextProxy = function(name, domainProxy, channel) {
    let isUnloaded = false;

    // context
    this.name = name;
    this.domain = domainProxy;
    this.isUnloaded = () => { return isUnloaded || domainProxy.isUnloaded(); };
    this.unload = () => {
        if (!isUnloaded) {
            // mark unloaded
            isUnloaded = true;

            // initiate remote unload
            channel.remoteCall('alc', name, false, 'unload');
        }
    };

    // types
    this.execute = (info, progressListener) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }
        return channel.remoteCall('alc', name, true, 'execute', [info], progressListener);
    };

    // assembly
    this.loadAssembly = (file) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }
        return channel.remoteCall('alc', name, false, 'loadAssembly', [file]);
    };  
    
    // busy state
    this.isBusy = () => { 
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        return channel.isBusy(); 
    };
 };
