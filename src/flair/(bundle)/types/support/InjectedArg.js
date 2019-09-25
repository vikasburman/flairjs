/**
 * @name InjectedArg
 * @description An argument that is injected by a custom attribute OR an advise
 * @example
 *  InjectedArg(value);
 * @params
 * @returns
 */ 
const InjectedArg = function(value) {
    this.value = value;
};
InjectedArg.filter = (args) => {
    // return all plain args, leaving all injected args
    let filteredArgs = [];
    if (args) {
        for(let a of args) {
            if (!(a instanceof InjectedArg)) { filteredArgs.push(a); }
        }
    }
    return filteredArgs;
};
InjectedArg.extract = (args) => {
    // return all injected args, in reverse order
    let injectedArgs = [];
    if (args) {
        for(let a of args) {
            if (a instanceof InjectedArg) { injectedArgs.push(a); }
        }
    }
    return injectedArgs.reverse();
};   

// attach to flair
a2f('InjectedArg', Object.freeze(InjectedArg));