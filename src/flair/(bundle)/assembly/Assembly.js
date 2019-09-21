/**
 * @name Assembly
 * @description Assembly object.
 */ 
const Assembly = function (ado, alc, asmClosureVars) {
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
    this.namespaces = () => { return ado.namespaces.slice(); }
    this.hasType = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.hasType); }
        return (ado.types.indexOf(qualifiedName) !== -1) ? true : false;
    };
    this.getType = (qualifiedName) => {
        return (this.hasType(qualifiedName) ? this.context.getType(qualifiedName) : null);
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
    this.hasResource = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.hasResource); }
        return (ado.resources.indexOf(qualifiedName) !== -1) ? true : false;
    };
    this.getResource = (qualifiedName) => {
        return (this.hasResource(qualifiedName) ? this.context.getResource(qualifiedName) : null);
    };

    // routes
    this.routes = () => { return ado.routes.slice(); }
    this.hasRoute = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.hasRoute); }
        return (ado.routes.indexOf(qualifiedName) !== -1) ? true : false;
    };    
    this.getRoute = (qualifiedName) => {
        return (this.hasRoute(qualifiedName) ? this.context.getRoute(qualifiedName) : null);
    };

    // assets
    const getAssetFilePath = (file) => { 
        // file: will be in local context of assembly, e.g., <asmFolder>/(assets)/myCSS.css will be referred everywhere as './myCSS.css'
        // passing ./myCSS.css to this method will return './<asmFolder>/myCSS.css'

        // in assets array, if assets were minified, file names were stored as fileName{.min}.ext AND
        // if assets were not minified, file names were stored as fileName.ext
        // however in here, file could be with or without {.min} in it - so we should see:
        //  if min is being asked, and min is available, give path for min
        //  if min is being asked, and min is not available, give path for normal
        //  if min is not being asked, and min is available, give path for normal
        //  if min is not being asked, and min is not available, give path for normal

        let _file = file,
            astFile = '',
            _normal = '',
            _min = '',
            isMinNeededIfAvailable = false;
        if (_file.indexOf('{.min}') !== -1) { 
            isMinNeededIfAvailable = true;
        } else if (_file.indexOf('.min') !== -1) {
            isMinNeededIfAvailable = true;
            _file = _file.replace('.min', '{.min}'); // because in array file might be stored as
        } else {
            isMinNeededIfAvailable = false;
            _file = _file.substr(0, _file.lastIndexOf('.')) + '{.min}' + _file.substr(_file.lastIndexOf('.')); // add {.min}
        }
        if (!options.env.isDebug && isMinNeededIfAvailable) { isMinNeededIfAvailable = false; } // bypassing which() call, directly checking if min is needed
        if (!_file.startsWith('./')) { _file = './' + _file; }
        _file = _file.replace('./', this.assetsPath()); // at this time now _file definitely has {.min}
        _min = _file.replace('{.min}', '.min'); 
        _normal = _file.replace('{.min}', '');

        // find
        if (isMinNeededIfAvailable) {
            if (ado.assets.indexOf(_file) !== -1) { // with {.min} placeholder
                astFile = _min; // name.min.ext
            } else if (ado.assets.indexOf(_normal) !== -1) { // without any .min or placeholder
                astFile = _normal; // name.ext
            } 
        } else {
            if (ado.assets.indexOf(_normal) !== -1) { // without any .min or placeholder
                astFile = _normal; // name.ext
            } else if (ado.assets.indexOf(_file) !== -1) { // with {.min} placeholder
                astFile = _normal; // still name.ext, since if .min is present in array, normal would definitely be present anyways as file
            } 
        }

        return astFile;        
    };
    const getLocaleFilePath = (locale, file) => {
        // file: will be in local context of assembly, e.g., <asmFolder>/(locale)/strings.json will be referred everywhere as './strings.json'
        // passing ./strings.json to this method will return './<asmFolder>/locales/<given-locale>/strings.json'

        // add locals 
        if (!file.startsWith('./')) { file = './' + file; }
        file = file.replace('./', `./locales/${locale}/`);

        return getAssetFilePath(file); 
    };

    this.assets = () => { return ado.assets.slice(); }
    this.hasAsset = (file) => {
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.hasAsset); }
        return getAssetFilePath(file) || false; // returns truthy or false
    };   
    this.getAsset = (file) => { 
        return this.hasAsset(file) || null; // returns string or null
    };  
    this.hasLocale = (locale, file) => {
        if (typeof locale !== 'string') { throw _Exception.InvalidArgument('locale', this.hasLocale); }
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.hasLocale); }
        return getLocaleFilePath(locale, file) || false; // returns truthy or false
    };
    this.getLocale = (locale, file) => { 
        return this.hasLocale(locale, file) || null; // returns string or null
    }; 
    this.path = () => {
        return this.alc.getAssemblyFile(this.file);
    };
    this.assetsPath = () => {
        return alc.getAssemblyAssetsPath(this.file);
    };
    this.localesPath = (locale) => {
        let localesPath = this.assetsPath() + 'locales/';
        if (locale) { localesPath += locale + '/' }
        return localesPath;
    };

    // config
    this.config = () => { return asmClosureVars.config; }
    
    // settings
    this.settings = () => { return asmClosureVars.settings; }
};
