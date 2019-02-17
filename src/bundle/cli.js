/**
 * @name cli
 * @description Command Line Interface setup for server use
 * @example
 *  cli.build(options, cb)
 */
const _cli = {
    build: (isServer ? require('./flair.build.js') : null)
};

// attach
flair.cli = Object.freeze(_cli);
flair.members.push('cli');
