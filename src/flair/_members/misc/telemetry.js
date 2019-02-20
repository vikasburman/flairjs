/**
 * @name telemetry
 * @description Telemetry enable/disable/filter/collect
 * @example
 *  .on()
 *  .on(...types)
 *  .on(handler, ...types)
 *  .collect()
 *  .off()
 *  .off(handler)
 *  .isOn()
 *  .types
 * @params
 *  types: string - as many types, as needed, when given, telemetry for given types only will be released
 *  handler: function - an event handler for telemetry event
 *                      Note: This can also be done using flair.on('telemetry', handler) call.
 */ 
let telemetry = _noop,
    telemetry_buffer = [],
    telemetry_max_items = 500;
const _telemetry = {
    // turn-on telemetry recording
    on: (handler, ...types) => {
        if (telemetry === _noop) {
            if (typeof handler === 'string') { types.unshift(handler); }
            else if (typeof handler === 'function') { _on('telemetry', handler); }

            // redefine telemetry
            telemetry = (type, data) => {
                if (types.length === 0 || types.indexOf(type) !== -1) { // filter
                    // pack
                    let item = Object.freeze({type: type, data: data});

                    // buffer
                    telemetry_buffer.push(item);
                    if (telemetry_buffer.length > (telemetry_max_items - 25)) {
                        telemetry_buffer.splice(0, 25); // delete 25 items from top, so it is always running buffer of last 500 entries
                    }

                    // emit
                    _post('telemetry', item);
                }
            };
        }
    },

    // collect buffered telemetry and clear buffer
    collect: () => {
        if (telemetry !== _noop) {
            let buffer = telemetry_buffer.slice();
            telemetry_buffer.length = 0; // initialize
            return buffer;
        }
        return [];
    },

    // turn-off telemetry recording
    off: (handler) => {
        if (telemetry !== _noop) {
            if (typeof handler === 'function') { _on('telemetry', handler, true); }

            // redefine telemetry
            telemetry = _noop;

            // return
            return _telemetry.collect();
        }
        return [];
    },

    // telemetry recording status check
    isOn: () => { return telemetry !== _noop; },

    // telemetry types list
    types: Object.freeze({
        RAW: 'raw',         // type and instances creation telemetry
        EXEC: 'exec',       // member access execution telemetry
        INFO: 'info',       // info, warning and exception telemetry
        INCL: 'incl'        // external component inclusion, fetch, load related telemetry
    })
};

// attach to flair
a2f('telemetry', _telemetry, () => {
    telemetry_buffer.length = 0;
});
