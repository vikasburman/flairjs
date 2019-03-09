/**
 * @name Port
 * @description Customize configurable functionality of the core. This gives a way to configure a different component to
 *              handle some specific functionalities of the core, e.g., fetching a file on server, or loading a module on
 *              client, or handling sessionStorage, to name a few.
 *              Ports are defined by a component and handlers of required interface types can be supplied from outside
 *              as per usage requirements
 * @example
 *  Port(name)                     // @returns handler/null - if connected returns handler else null
 *  Port.define(name, type, intf)  // @returns void
 *  Port.connect(name, handler)    // @returns void
 *  Port.disconnect(name)          // @returns void
 *  Port.disconnect.all()          // @returns void
 *  Port.isDefined(name)           // @returns boolean - true/false
 *  Port.isConnected(name)         // @returns boolean - true/false
 * @params
 *  name: string - name of the port
 *  members: string - array of strings having member names that are checked for their presence
 *  handler: function - a factory that return the actual handler to provide named functionality for current environment
 *  inbuilt: function - an inbuilt factory implementation of the port functionality, if nothing is configured, this implementation will be returned
 *          NOTE: Both factory and inbuilt are passed flair.options.env object to return most suited implementation of the port
 * @returns handler/boolean/void - as specified above
 */ 
let ports_registry = {};
const _Port = (name) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    if (ports_registry[name]) {
        return (ports_registry[name].handler ? ports_registry[name].handler : ports_registry[name].inbuilt); // inbuilt could also be null if not inbuilt implementation is given
    }
    return null;
};
_Port.define = (name, members, inbuilt) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    if (members && !Array.isArray(members)) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (members)'); }
    if (ports_registry[name]) { throw new _Exception('Duplicate', `Port is already defined. (${name})`); }

    ports_registry[name] = {
        type: (members ? 'object' : 'function'),
        members: members || null,
        handler: null,
        inbuilt: (typeof inbuilt !== 'undefined' ? inbuilt(options.env) : null)
    };
};
_Port.connect = (name, handler) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }    
    if (typeof handler !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (handler)'); } 
    if (!ports_registry[name]) { throw new _Exception('NotFound', `Port is not defined. (${name})`); } 

    let actualHandler = handler(options.env); // let it return handler as per context
    if (typeof actualHandler !== ports_registry[name].type) { throw new _Exception('InvalidType', `Handler type is invalid. (${name})`); } 
    let members = ports_registry[name].members;
    if (members) { 
        for(let member of members) {
            if (typeof actualHandler[member] === 'undefined') { throw new _Exception('InvalidType', `Handler interface is invalid. (${name})`); }
        }
    }
    ports_registry[name].handler = actualHandler;
};
_Port.disconnect = (name) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }    
    if (ports_registry[name]) {
        ports_registry[name].handler = null;
    }
};
_Port.isDefined = (name) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }    
    return (ports_registry[name] ? true : false);
};
_Port.isConnected = (name) => {
    return (ports_registry[name] && ports_registry[name].handler ? false : true);
};

// attach to flair
a2f('Port', _Port, () => {
    // disconnect all ports
    for(let port in ports_registry) {
        if (ports_registry.hasOwnProperty(port)) {
            ports_registry[port].handler = null;
        }
    }

    // clear registry
    ports_registry = {};
});