/**
 * @name Assembly
 * @description Assembly object.
 */ 
const Assembly = function (ado, alc) {
    this.context = alc;

    this.name = ado.name;
    this.file = ado.file;
    this.desc = ado.desc;
    this.version = ado.version;
    this.copyright = ado.copyright;
    this.license = ado.license;
    this.lupdate = ado.lupdate;
    this.builder = ado.builder.name;
    this.flairVersion = ado.builder.version;
    this.format = Object.freeze({
        name: ado.builder.format,
        version: ado.builder.formatVersion,
        contains: ado.builder.contains.slice()
    });
   
    // types
    this.types = () => { return ado.types.slice(); }
    this.getType = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw new _Exception('InvalidArgument', `Argument type is not valid. (${qualifiedName})`); }
        if (ado.types.indexOf(qualifiedName) === -1) { throw new _Exception('NotFound', `Type is not available in this assembly. (${qualifiedName})`); }
        return this.context.getType(qualifiedName);
    };
    this.getTypes = (intf) => {
        if (['string', 'interface'] !== _typeOf(intf)) { throw new _Exception('InvalidArgument', `Argument type is not valid. (${intf})`); }
        let result = [];
        for(let qualifiedName of ado.types) {
            try {
                let Type = this.context.getType(qualifiedName);
                if (_isImplements(Type, intf)) {
                    result.push(Type);
                }
            } catch (e) {
                // ignore as for incompatible types it will throw, and that's ok in this context
            }
        }
        return result;
    };

    // resources
    this.resources = () => { return ado.resources.slice(); }
    this.getResource = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw new _Exception('InvalidArgument', `Argument type is not valid. (${qualifiedName})`); }
        if (ado.resources.indexOf(qualifiedName) === -1) { throw new _Exception('NotFound', `Resource is not available in this assembly. (${qualifiedName})`); }
        return this.context.getResource(qualifiedName);
    };

    // assets
    this.assets = () => { return ado.assets.slice(); }
    this.assetsRoot = this.file.replace('.js', '/');
    this.getAsset = (file) => { 
        if (typeof file !== 'string') { throw new _Exception('InvalidArgument', `Argument type is not valid. (${file})`); }
        // file: will be in local context of assembly, e.g., <asmFolder>/(assets)/myCSS.css will be referred everywhere as './myCSS.css'
        // passing ./myCSS.css to this method will return './<asmFolder>/myCSS.css'
        let astFile = file.replace('./', this.assetsRoot);
        if (ado.assets.indexOf(file) === -1) { throw new _Exception('NotFound', `Asset is not available for this assembly. (${astFile})`); }
        return astFile;        
    };
};
