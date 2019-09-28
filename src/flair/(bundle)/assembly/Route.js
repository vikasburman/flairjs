/**
 * @name Route
 * @description Route object.
 */ 
const Route = function(asmFile, route, ns, alc) {
    this.context = alc;

    this.name = route.name;
    this.ns = ns;
    this.assembly = () => { return alc.getAssembly(asmFile) || null; };
    this.index = route.index;
    this.type = route.type || -1;
    this.connection = route.connection || '';
    this.mount = route.mount;
    this.verbs = route.verbs || (isServer ? ['get'] : ['view']); // default verb
    this.mw = route.mw || [];
    this.path = route.path;
    this.handler = route.handler;
};
