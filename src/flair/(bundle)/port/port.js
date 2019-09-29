/**
 * @name Port
 * @description Customize configurable functionality of the core. This gives a way to configure a different component to
 *              handle some specific functionalities of the core, e.g., fetching a file on server, or loading a module on
 *              client, or handling sessionStorage, to name a few.
 *              Ports are defined by a component and handlers of required interface (complies, not implements) types can be 
 *              supplied from outside as per usage requirements
 * @example
 *  Port(name)                     // returns handler/null - if connected returns handler else null
 *  Port.define(name, members)     
 *  Port.connect(ph)
 *  Port.disconnect(name)
 *  Port.isDefined(name)
 *  Port.isConnected(name)
 * @params
 *  name: string - name of the port
 *  members: array of strings - having member names that are checked for their presence when a port is accepted and connected
 *  ph: object - an object having all required members defined in port definition
 */ 
let ports_registry = {};
const _Port = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port); }
    return ((ports_registry[name] && ports_registry[name].handler) ? ports_registry[name].handler : null);
};
_Port.define = (name, members) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port); }
    if (!Array.isArray(members) || members.length === 0) { throw _Exception.InvalidArgument('members', _Port); }
    if (ports_registry[name]) { throw _Exception.Duplicate(name, _Port.define); }

    ports_registry[name] = {
        members: members,
        handler: null
    };
};
_Port.connect = (ph) => {
    const { IPortHandler } = _ns(); // sync call for root namespace
    if (!_as(ph, IPortHandler)) { throw _Exception.InvalidArgument('ph', _Port.connect); }
    if (!ph.name) { throw _Exception.InvalidArgument('ph', _Port.connect); }
    if (!ports_registry[ph.name]) { throw _Exception.NotFound(name, _Port.connect); } 

    let members = [ph.name].members;
    for(let member of members) {
        if (typeof ph[member] === 'undefined') { throw  _Exception.NotImplemented(member, _Port.connect); }
    }
    ports_registry[name].handler = ph;
};
_Port.disconnect = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.disconnect); }
    if (ports_registry[name]) { ports_registry[name].handler = null; }
};
_Port.isDefined = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.isDefined); }
    return (ports_registry[name] ? true : false);
};
_Port.isConnected = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.isConnected); }
    return ((ports_registry[name] && ports_registry[name].handler !== null) ? true : false);
};

// attach to flair
a2f('Port', _Port, () => {
    ports_registry = {}; // clear registry
});