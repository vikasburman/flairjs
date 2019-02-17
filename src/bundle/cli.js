/**
 * @name cli
 * @description Command Line Interface setup for server use
 * @example
 *  cli.build(options, cb)
 */
const _cli = {
    build: (isServer ? require('./flair.build.js') : null)
};

// attach to flair
a2f('cli', _cli);

