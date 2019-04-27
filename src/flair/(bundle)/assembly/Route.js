/**
 * @name Route
 * @description Route object.
 */ 
const Route = function(route, ns, alc) {
    this.context = alc;

    this.name = route.name;
    this.ns = ns;
    this.assembly = () => { return alc.getAssembly(which(route.asmFile, true)) || null; };
    this.index = route.index;
    this.mount = route.mount;
    this.verbs = route.verbs;
    this.path = route.path;

    // load handler type, as handler must be from same assembly, so should be loaded without async call
    this.Handler = _getType(route.handler);
    if (!this.Handler) { throw _Exception.InvalidDefinition(route.handler, Route); }
};
