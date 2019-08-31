/**
 * @name Assembly
 * @description Assembly object.
 */ 
const Assembly = function (ado, alc, asmClosureVars) {
    let namespaces = null;
    this.context = alc;
    this.domain = alc.domain;

    this.name = ado.name;
    this.file = ado.file;
    this.package = ado.package;
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
    this.namespaces = () => {
        if (!namespaces) {
            namespaces = [];
            for(let qt of ado.types) {
                // each qualified type is a namespaceName.typeName
                // therefore - remove type name part
                let nsName = qt.substr(0, qt.lastIndexOf('.'));
                if (namespaces.indexOf(nsName) === -1) {
                    namespaces.push(nsName);
                }
            }
        }
        return namespaces;
    };
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
    this.path = () => {
        return this.alc.getAssemblyFile(this.file);
    };
    this.assetsPath = () => {
        return alc.getAssemblyAssetsPath(this.file);
    };
    this.getAssetFilePath = (file) => { 
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getAssetFilePath); }

        // file: will be in local context of assembly, e.g., <asmFolder>/(assets)/myCSS.css will be referred everywhere as './myCSS.css'
        // passing ./myCSS.css to this method will return './<asmFolder>/myCSS.css'
        let astFile = file.replace('./', this.assetsPath());
        if (ado.assets.indexOf(astFile) === -1) {  throw _Exception.NotFound(astFile, this.getAssetFilePath); }
        return astFile;        
    };
    this.getLocaleFilePath = (locale, file) => {
        if (typeof locale !== 'string') { throw _Exception.InvalidArgument('locale', this.getLocaleFilePath); }
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getLocaleFilePath); }

        // file: will be in local context of assembly, e.g., <asmFolder>/(locale)/strings.json will be referred everywhere as './strings.json'
        // passing ./strings.json to this method will return './<asmFolder>/locales/<given-locale>/strings.json'
        let localeFile = file.replace('./', this.assetsPath() + 'locales/' + locale + '/');
        return localeFile;        
    };

    // config
    this.config = () => { return asmClosureVars.config; }
    
    // settings
    this.settings = () => { return asmClosureVars.settings; }
};
