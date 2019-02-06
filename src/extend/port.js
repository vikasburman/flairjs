/**
 * @name Port
 * @description Customize configurable functionality of the core. This gives a way to configure a different component to
 *              handle some specific functionalities of the core, e.g., fetching a file on server, or loading a module on
 *              client, or handling sessionStorage or a pubsub system, to name a few.
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
 *  type: string - type of the handler - generally it will be 'function' or 'object' or 'instance' or 'sinstance'
 *  intf: interface/array - flair interface type that the handler should have implemented / complies to OR it can
 *                          be defined as an array of strings having member names that are checked for their presence
 *  handler: object/function - the actual handler to provide named functionality
 * @returns handler/boolean/void - as specified above
 */ 
let ports = {};
const _Port = (name) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    return (ports[name] ? ports[name].handler : null);
};
_Port.define = (name, type, intf) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    if (typeof type !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
    if (intf && ['interface', 'array'].indexOf(_typeOf(intf)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (intf)'); }
    if (ports[name]) { throw new _Exception('Duplicate', `Port is already defined. (${name})`); }

    ports[name] = {
        type: type,
        interface: intf || null,
        handler: null
    };
};
_Port.connect = (name, handler) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }    
    if (!handler) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (handler)'); } 
    if (!ports[name]) { throw new _Exception('NotFound', `Port is not defined. (${name})`); } 
    if (_typeOf(handler) !== ports[name].type) { throw new _Exception('InvalidType', `Handler type is invalid. (${name})`); } 
    let intf = ports[name].intf;
    if (intf) { 
        if (Array.isArray(intf)) {
            for(let member of intf) {
                if (typeof handler[member] === 'undefined') { throw new _Exception('InvalidType', `Handler interface is invalid. (${name})`); }
            }
        } else if (!_isImplements(handler, intf) || !_isComplies(handler, intf)) { 
            throw new _Exception('InvalidType', `Handler interface is invalid. (${name})`);
        }
    }
    
    ports[name].handler = handler;
};
_Port.disconnect = (name) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }    
    if (ports[name]) {
        ports[name].handler = null;
    }
};
_Port.disconnect.all = () => {
    for(let port in ports) {
        if (ports.hasOnwProperty(port)) {
            ports[port].handler = null;
        }
    }
};
_Port.isDefined = (name) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }    
    return (ports[name] ? true : false);
};
_Port.isConnected = (name) => {
    return (ports[name] && ports[name].handler ? false : true);
};
_Port._ = { reset: () => { ports = {}; } };

// attach
flair._Port = _Port;
flair.members.push('Port');