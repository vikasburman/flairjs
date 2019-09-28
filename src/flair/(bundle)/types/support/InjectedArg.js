/**
 * @name InjectedArg
 * @description An argument that is injected by a custom attribute OR an advise
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
    // return all raw injected args, in reverse order
    let injectedArgs = [];
    if (args) {
        for(let a of args) {
            if (a instanceof InjectedArg) { injectedArgs.push(a.value); }
        }
    }
    return injectedArgs.reverse();
};   

// attach to flair
a2f('InjectedArg', Object.freeze(InjectedArg));