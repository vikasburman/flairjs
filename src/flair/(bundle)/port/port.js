/**
 * @name Port
 * @description Customize configurable functionality of the core. This gives a way to configure a different component to
 *              handle some specific functionalities of the core, e.g., fetching a file on server, or loading a module on
 *              client, or handling sessionStorage, to name a few.
 *              Ports are defined by a component and handlers of required interface types can be supplied from outside
 *              as per usage requirements
 * @example
 *  Port(name)                     // @returns handler/null - if connected returns handler else null
 *  Port.define(name, members, intf)  // @returns void
 *  Port.connect(name, handler)    // @returns void
 *  Port.disconnect(name)          // @returns void
 *  Port.disconnect.all()          // @returns void
 *  Port.isDefined(name)           // @returns boolean - true/false
 *  Port.isConnected(name)         // @returns boolean - true/false
 * @params
 *  name: string - name of the port
 *  members: array of strings - having member names that are checked for their presence
 *  handler: function - a factory that return the actual handler to provide named functionality for current environment
 *  inbuilt: function - an inbuilt factory implementation of the port functionality, if nothing is configured, this implementation will be returned
 *          NOTE: Both handler and inbuilt are passed flair.options.env object to return most suited implementation of the port
 * @returns handler/boolean/void - as specified above
 */ 
let ports_registry = {};
const _Port = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port); }
    if (ports_registry[name]) {
        return (ports_registry[name].handler ? ports_registry[name].handler : ports_registry[name].inbuilt); // inbuilt could also be null if not inbuilt implementation is given
    }
    return null;
};
_Port.define = (name, members, inbuilt) => {
    let args = _Args('name: string, members: array, inbuilt: afunction',
                     'name: string, inbuilt: afunction',
                     'name: string, members: array',
                     'name: string')(name, members, inbuilt); args.throwOnError(_Port.define);

    if (ports_registry[name]) { throw _Exception.Duplicate(name, _Port.define); }
    ports_registry[name] = {
        type: (args.values.members ? 'object' : 'function'), // a port handler can be 
        members: args.values.members || null,
        handler: null,
        inbuilt: (args.values.inbuilt ? args.values.inbuilt(options.env) : null)
    };
};
_Port.connect = (name, handler) => {
    let args = _Args('name: string, handler: afunction')(name, handler); args.throwOnError(_Port.connect);

    if (!ports_registry[name]) { throw _Exception.NotFound(name, _Port.connect); } 
    let actualHandler = handler(options.env); // let it return handler as per context
    if (typeof actualHandler !== ports_registry[name].type) { throw _Exception.InvalidArgument('handler', _Port.connect); } 
    let members = ports_registry[name].members;
    if (members) { 
        for(let member of members) {
            if (typeof actualHandler[member] === 'undefined') { throw  _Exception.NotImplemented(member, _Port.connect); }
        }
    }
    ports_registry[name].handler = actualHandler;
};
_Port.disconnect = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.disconnect); }
    if (ports_registry[name]) {
        ports_registry[name].handler = null;
    }
};
_Port.isDefined = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.isDefined); }
    return (ports_registry[name] ? true : false);
};
_Port.isConnected = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.isConnected); }
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