const Dispatcher = function() {
    let events = {};
    this.add = (event, handler) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (event)'); }
        if (typeof handler !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (handler)'); }
        if(!this.events[event]) { this.events[name] = []; }
        this.events[name].push(fn);
    };
    this.remove = (event, handler) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (event)'); }
        if (typeof handler !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (handler)'); }
        if(this.events[event]) {
            let idx = this.events[event].indexOf(handler);
            if (idx !== -1) { this.events[event].splice(idx, 1); }
        }
    };
    this.dispatch = (event, args) => {
        if (this.events[event]) {
            this.events[event].forEach(handler => {
                setTimeout(() => { handler({ name: event, args: args }); }, 0);
            });
        }
    };
    this.count = (event) => {
        return (this.events[event] ? this.events[event].length : 0);
    };
};

