/**
 * @name Channel
 * @description Listens to various channels on which raw telemetry is sent to by the core
 *              this helps in troubleshooting as well as optimization and building dev tools
 *              around this
 * @example
 *  Channel(name, telemetry)                    // @returns void
 *  Channel.define(name, path)                  // @returns void
 *  Channel.publish()                           // @returns void
 *  Channel.activate(freq)                      // @returns void
 *  Channel.deactivate()                        // @returns void
 *  Channel.isDefined(name)                     // @returns boolean - true/false
 *  Channel.isActive()                          // @returns boolean - true/false
 * @params
 *  name: string - name of the channel - representing a telemetry type
 *  path: string - any pubsub path mapped to this channel where to publish it
 *  freq: number - number of seconds it should wait before pushing the buffered telemetry bunch out to the 'pubsub' port
 *  telemetry: object - telemetry object looks like this:
 *                      {
 *                          id: '<a unique id>',
 *                          type: '<telemetry type>,
 *                          stamp: '<time stamp>,
 *                          payload: {}
 *                      }
 *                      payload is defined as per telemetry type
 * @returns boolean/void - as specified above
 */ 
let channels = {},
    timerId = null,
    lastFreq = null,
    lastChnls = null,
    _Channel,
    resetMember = (newChannel) => {
        _Channel = newChannel;
        flair.Channel = _Channel;
        if (!options.env.suppressGlobals) {
            _global['Channel'] = _Channel;
        }
    };
const _ChannelActive = (name, payload) => {
    if (!timerId) { return; } // no telemetry process when not active
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    if (!channels[name]) { throw new _Exception('NotFound', `Channel is not defined. (${name})`); } 
    if (!payload) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (payload)'); }

    let telemetry = {
        id: guid(),
        type: name,
        stamp: Date.now(),
        payload: payload
    };
    channels[name].buffer.push(telemetry);
};
_ChannelActive.define = (name, path) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    if (typeof path !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (path)'); }
    if (channels[name]) { throw new _Exception('Duplicate', `Channel is already defined. (${name})`); }

    channels[name] = {
        path: path,
        buffer: []
    };
};
_ChannelActive.publish = () => {
    let isActive = _Channel.isActive();
    clearInterval(timerId); // so it does not call again while in the process

    // get pubsub port handler
    let pubsub = _Port('pubsub');
    if (!pubsub) { throw new _Exception('NotConfigured', 'Port is not configured. (pubsub)'); }

    // publish all buffered telemetry as one message for each channel
    for(let channel in channels) {
        if (channels.hasOwnProperty(channel)) {
            if (channels[channel].buffer.length > 0) {
                if (!lastChnls || (lastChnls && lastChnls.indexOf(channel) !== -1)) {
                    pubsub.publish(channels[channel].path, channels[channel].buffer.slice());
                }
                channels[channel].buffer.length = 0; // clear
            }
        }
    }

    if (isActive) { // reactivate, if it was active last
        timerId = setInterval(_Channel.publish, lastFreq);
    }
};
_ChannelActive.activate = (freq, chnls) => {
    if (!timerId) {
        if (typeof freq !== 'number') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (freq)'); }
        resetMember(_ChannelActive); // switch tp active version
        lastFreq = freq;
        lastChnls = chnls || []; // channels of interest
        timerId = setInterval(_Channel.publish, freq);
    }
};
_ChannelActive.deactivate = () => {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
        lastChnls = null;
        resetMember(_ChannelInactive); // switch tp inactive (noop) version

        // clear buffer
        for(let channel in channels) {
            if (channels.hasOwnProperty(channel)) {
                channels[channel].buffer.length = 0; // clear
            }
        }        
    }
};
_ChannelActive.isDefined = (name) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }    
    return (channels[name] ? true : false);
};
_ChannelActive.isActive = () => { return timerId !== null; }
_ChannelActive._ = { 
    reset: () => { 
        _Channel.deactivate();
        channels = {}; 
    } 
};

const _ChannelInactive = () => {};
_ChannelInactive.define = _ChannelActive.define;
_ChannelInactive.publish = _ChannelActive.publish;
_ChannelInactive.activate = _ChannelActive.activate;
_ChannelInactive.deactivate = _ChannelActive.deactivate;
_ChannelInactive.isDefined = _ChannelActive.isDefined;
_ChannelInactive.isActive = _ChannelActive.isActive;
_ChannelInactive._ = _ChannelActive._;

_Channel = _ChannelInactive;

// attach
flair.Channel = _Channel;
flair.members.push('Channel');