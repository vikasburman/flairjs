/**
 * @name Assembly
 * @description Assembly object.
 */ 
const Assembly = function (ado, alc, asmClosureVars) {
    this.context = alc;

    this.name = ado.name;
    this.file = ado.file;
    this.mainAssembly = ado.mainAssembly;
    this.desc = ado.desc;
    this.title = ado.title;
    this.version = ado.version;
    this.copyright = ado.copyright;
    this.license = ado.license;
    this.lupdate = ado.lupdate;
    this.builder = ado.builder.name;
    this.builderVersion = ado.builder.version;
    this.format = Object.freeze({
        name: ado.builder.format,
        version: ado.builder.formatVersion,
        contains: ado.builder.contains.slice()
    });
   
    // types
    this.types = () => { return ado.types.slice(); }
    this.getType = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getType); }
        if (ado.types.indexOf(qualifiedName) === -1) { throw _Exception.NotFound(qualifiedName, this.getType); }
        return this.context.getType(qualifiedName);
    };
    this.getTypes = (intf) => {
        if (['string', 'interface'] !== _typeOf(intf)) { throw _Exception.InvalidArgument('intf', this.getTypes); }
        let result = [];
        for(let qualifiedName of ado.types) {
            try {
                let Type = this.context.getType(qualifiedName);
                if (_isImplements(Type, intf)) {
                    result.push(Type);
                }
            } catch (err) {
                // ignore as for incompatible types it will throw, and that's ok in this context
            }
        }
        return result;
    };

    // resources
    this.resources = () => { return ado.resources.slice(); }
    this.getResource = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getResource); }
        if (ado.resources.indexOf(qualifiedName) === -1) { throw _Exception.NotFound(qualifiedName, this.getResource); }
        return this.context.getResource(qualifiedName);
    };

    // routes
    this.routes = () => { return ado.routes.slice(); }
    this.getRoute = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getRoute); }
        if (ado.routes.indexOf(qualifiedName) === -1) { throw _Exception.NotFound(qualifiedName, this.getRoute); }
        return this.context.getRoute(qualifiedName);
    };

    // assets
    this.assets = () => { return ado.assets.slice(); }
    this.assetsRoot = this.file.replace('.js', '/');
    this.getAsset = (file) => { 
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getAsset); }

        // file: will be in local context of assembly, e.g., <asmFolder>/(assets)/myCSS.css will be referred everywhere as './myCSS.css'
        // passing ./myCSS.css to this method will return './<asmFolder>/myCSS.css'
        let astFile = file.replace('./', this.assetsRoot);
        if (ado.assets.indexOf(file) === -1) {  throw _Exception.NotFound(astFile, this.getAsset); }
        return astFile;        
    };

    // config
    this.config = () => { return asmClosureVars.config; }
    
    // settings
    this.settings = () => { return asmClosureVars.settings; }
};
