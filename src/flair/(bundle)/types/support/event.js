/**
 * @name event
 * @description Event marker
 * @example
 *  event()
 * @params
 *  argsProcessor - args processor function, if args to be processed before event is raised
 * @returns {function}
 *  function - returns given function or a noop function as is with an event marked tag
 */ 
const _event = (argsProcessor) => { 
    let args = _Args('argsProcessor: undefined',
                     'argsProcessor: afunction')(argsProcessor); args.throwOnError(_event);
    argsProcessor = argsProcessor || ((...eventArgs) => { return eventArgs; });
    argsProcessor.event = true; // attach tag
    return argsProcessor;
}

// attach to flair
a2f('event', _event);
