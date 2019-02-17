const Dispatcher = function() {
    let events = {};

    // add event listener
    this.add = (event, handler) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (event)'); }
        if (typeof handler !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (handler)'); }
        if (!events[event]) { events[name] = []; }
        events[name].push(handler);
    };

    // remove event listener
    this.remove = (event, handler) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (event)'); }
        if (typeof handler !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (handler)'); }
        if (events[event]) {
            let idx = events[event].indexOf(handler);
            if (idx !== -1) { events[event].splice(idx, 1); }
        }
    };

    // dispatch event
    this.dispatch = (event, args) => {
        if (events[event]) {
            events[event].forEach(handler => {
                setTimeout(() => { handler({ name: event, args: args }); }, 0);
            });
        }
    };

    // get number of attached listeners
    this.count = (event) => {
        return (events[event] ? events[event].length : 0);
    };

    // clear all handlers for all events associated with this dispatcher
    this.clear = () => {
        events = {};
    };
};

