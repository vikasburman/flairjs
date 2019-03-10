/**
 * @name Dispatcher
 * @description Event dispatching. 
 */ 
const Dispatcher = function(eventHost) {
    let events = {};
    eventHost = eventHost || '';

    // add event listener
    this.add = (event, handler) => {
        let args = _Args('event: string, handler: afunction')(event, handler); args.throwOnError(this.add);
        if (!events[event]) { events[event] = []; }
        events[event].push(handler);
    };

    // remove event listener
    this.remove = (event, handler) => {
        let args = _Args('event: string, handler: afunction')(event, handler); args.throwOnError(this.remove);
        if (events[event]) {
            let idx = events[event].indexOf(handler);
            if (idx !== -1) { events[event].splice(idx, 1); }
        }
    };

    // dispatch event
    this.dispatch = (event, eventArgs) => {
        let args = _Args('event: string')(event); args.throwOnError(this.dispatch); // note: no check for eventArgs, as it can be anything
        if (events[event]) {
            events[event].forEach(handler => {
                // NOTE: any change here should also be done in SharedChannel where progress event is being routed across threads
                setTimeout(() => { handler(Object.freeze({ host: eventHost, name: event, args: eventArgs || [] })); }, 0); // <-- event handler will receive this
            });
        }
    };

    // get number of attached listeners
    this.count = (event) => {
        let args = _Args('event: string')(event); args.throwOnError(this.count);
        return (events[event] ? events[event].length : 0);
    };

    // clear all handlers for all events associated with this dispatcher
    this.clear = () => {
        events = {};
    };
};

