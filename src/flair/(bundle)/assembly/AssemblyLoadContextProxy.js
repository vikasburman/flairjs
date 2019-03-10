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
    this.execute = (info, progressListener) => { // check AssemblyLoadContext.execute for greater details about 'info' and others
        if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.execute); }

        // extract context, and add internal context
        let ctx = info.ctx || {};
        ctx._ = {
            host: info.type
        };
        return channel.remoteCall('alc', name, true, 'execute', [info], ctx, progressListener); // info.type is passed in context, so progress event's host is set properly
    };

    // assembly
    this.loadAssembly = (file) => {
        if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.loadAssembly); }
        return channel.remoteCall('alc', name, false, 'loadAssembly', [file]);
    };  
    
    // state
    this.isBusy = () => { 
        if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.isBusy); }
        return channel.isBusy(); 
    };
    this.hasActiveInstances = () => { 
        channel.remoteCall('alc', name, false, 'hasActiveInstances');
    };
 };
