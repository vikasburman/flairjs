/**
 * @name AssemblyLoadContextProxy
 * @description Proxy of the AssemblyLoadContext that is created inside other AppDomain.
 */
const AssemblyLoadContextProxy = function(name, domainProxy, channel) {
    // context
    this.name = name;
    this.domain = domainProxy;
    this.isUnloaded = () => { return domainProxy.isUnloaded(); };

    // types
    this.execute = (info) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }
        return channel.remoteCall('alc', 'execute', info);
    };

    // assembly
    this.loadAssembly = (file) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }
        return channel.remoteCall('alc', 'loadAssembly', file);
    };    
 };
