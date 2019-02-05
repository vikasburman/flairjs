// reset all globals
let resetFunc = null,
internalAPI = null;
for(let name of _global.flair.members) {
    internalAPI = _global.flair[name]._;
    resetFunc = (internalAPI && internalAPI.reset) ? internalAPI.reset : null;
    if (typeof resetFunc === 'function') { resetFunc(); }
    delete _global[name];
}

// delete main global
delete _global.flair;