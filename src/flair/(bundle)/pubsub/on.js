/**
 * @name on
 * @description Register an event handler to handle a specific event. 
 * @example
 *  on(event, handler)
 *  on(event, handler, isRemove)
 * @params
 *  event: string - Name of the even to subscribe to
 *  handler: function - event handler function
 *  isRemove: boolean - is previously associated handler to be removed
 * @returns void
 */ 
const _dispatcher = new Dispatcher();
const _dispatchEvent = _dispatcher.dispatch;  // this can be used via dispatch member to dispatch any event
const _on = (event, handler, isRemove) => {
    if (isRemove) { _dispatcher.remove(event, handler); return; }
    _dispatcher.add(event, handler);
};

// attach to flair
a2f('on', _on, () => {
    _dispatcher.clear();
});
