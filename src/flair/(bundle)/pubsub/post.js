/**
 * @name post
 * @description Dispatch an event for any flair component to react.
 *              This together with 'on' makes a local pub/sub system which is capable to react to external
 *              events when they are posted via 'post' here and raise to external world which can be hooked to 'on'
 * @example
 *  post(event)
 *  post(event, args)
 * @params
 *  event: string - Name of the even to dispatch
 *         Note: external events are generally namespaced like pubsub.channelName
 *  args: any - any arguments to pass to event handlers
 * @returns void
 */ 
const _post = (event, args) => {
    if (typeof event !== 'string') { throw _Exception.InvalidArgument('event', _post); }
    _dispatchEvent(event, args);
};

// attach to flair
a2f('post', _post);
