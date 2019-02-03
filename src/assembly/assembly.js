let asmFiles = {},
    asmTypes = {};

/**
 * @name Assembly
 * @description Constructs an Assembly object
 * @example
 *  Assembly(ado)
 * @params
 *  ado: object - An ADO is an object that defines assembly definition as:
 *      name: string - name
 *      file: string - file name and path
 *      desc: string - description
 *      version: string - version
 *      copyright: string - copyright message
 *      license: - string - license
 *      types: - array - list of all type names that reside in this assembly
 *      assets: - array - list of all assets that are available outside this assembly but deployed together
 *      settings: - assembly settings
 * @returns object - flair assembly object
 * @throws
 *  InvalidArgumentException
 *  InvalidFormatException
 */ 
flair.Assembly = (ado) => {
    if (typeof ado !== 'object') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (ado)'); }
    if (_typeOf(ado.types) !== 'array' || 
        _typeOf(ado.assets) !== 'array' ||
        typeof ado.name !== 'string' ||
        typeof ado.file !== 'string') {
        throw new _Exception('InvalidFormat', 'Object format is not valid. (ado)');
    }
    
    // minified/dev contextual pick
    let asmFile = which(ado.file, true);

     // assembly object
    let _Assembly = {
        name: ado.name,
        file: asmFile,
        desc: ado.desc || '',
        version: ado.version || '',
        copyright: ado.copyright || '',
        license: ado.license || '',
        types: Object.freeze(ado.types.slice()),
        settings:  Object.freeze(ado.settings || {}),
        assets: Object.freeze(ado.assets.slice()),
        hasAssets: (ado.assets.length > 0),
        isLoaded: () => { return mex.isLoaded; },
        load: () => { return flair.Assembly.load(asmFile); },
        getType: (name) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (name)'); }
            if (!mex.isLoaded) { throw new _Exception('NotLoaded', `Object is not loaded. (${asmFile})`); }
            if(_Assembly.types.indexOf(name) === -1) { throw new _Exception('NotFound', `Object is not found. (${name})`); }
            let Type = flair.Namespace.getType(name);
            if (!Type) { throw new _Exception('NotRegistered', `Object is not registered. (${name})`); }
            return Type;
        },
        createInstance: (name, ...args) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (name)'); }
            let Type = _Assembly.getType(name),
                obj = null;
            if (args) {
                obj = new Type(...args);
            } else {
                obj = new Type();
            }
            return obj;
        }
    };

    // meta extensions
    let mex = {
        name: ado.name,
        ado: Object.freeze(ado),
        isLoaded: false,
        markLoaded: () => { mex.isLoaded = true; }        
    };

    // return
    return flarizedInstance('assembly', _Assembly, mex)
};

/**
 * @name register
 * @description Register one or more assemblies as per given Assembly Definition Objects
 * @example
 *  register(...ados)
 * @params
 *  ados: object - An ADO is an object that defines assembly definition as:
 *      name: string - name
 *      file: string - file name and path
 *      desc: string - description
 *      version: string - version
 *      copyright: string - copyright message
 *      license: - string - license
 *      types: - array - list of all type names that reside in this assembly
 *      assets: - array - list of all assets that are available outside this assembly but deployed together
 *      settings: - assembly settings
 * @returns boolean - true/false
 * @throws
 *  InvalidArgumentException
 *  InvalidFormatException
 *  DuplicateNameException
 */ 
flair.Assembly.register = (...ados) => { 
    if (!ados) { throw new _Exception('InvalidArgument', 'Argument type is not valid. (ados)'); }

    let success = false;
    for(let ado of ados) {
        let asm = flair.Assembly(ado),
            asmFile = asm.file;
        if (asmFiles[asmFile]) {
            throw new _Exception('DuplicateName', `Duplicate names are not allowed. (${asmFile})`);
        } else {
            // register
            asmFiles[asmFile] = asm;

            // load types
            for(let type of asm.types) {
                // qualified names across anywhere should be unique
                if (asmTypes[type]) {
                    throw new _Exception('DuplicateName', `Duplicate names are not allowed. (${type})`);
                } else {
                    asmTypes[type] = asm; // means this type can be loaded from this assembly
                }
            }

            // success
            success = true;
        }
    }

    // returns
    return success;
};

/**
 * @name load
 * @description Loads an assembly file
 * @example
 *  load(file)
 * @params
 *  file: string - Assembly file to be loaded
 * @returns object - promise object
 * @throws
 *  InvalidArgumentException
 *  NotRegisteredException
 *  FileLoadException
 */
flair.Assembly.load = (file) => {
    return new Promise((resolve, reject) => {
        if (typeof file !== 'string') { reject(new _Exception('InvalidArgument', 'Argument type is not valid. (file)')); return; }
        if (!flair.Assembly.isRegistered(file)) { reject(new _Exception('NotRegistered', `Object is not registered. (${file})`)); return; }

        if (asmFiles[file].isLoaded()) { resolve(); return; }
            
        if (isServer) {
            try {
                require(file);
                asmFiles[file]._.markLoaded();
                resolve();
            } catch (e) {
                reject(new _Exception('FileLoad', `File load failed. (${file})`, e));
            }
        } else {
            const script = flair.options.env.global.document.createElement('script');
            script.onload = () => {
                asmFiles[file]._.markLoaded();
                resolve();
            };
            script.onerror = (e) => {
                reject(new _Exception('FileLoad', `File load failed. (${file})`, e));
            };
            script.async = true;
            script.src = file;
            flair.options.env.global.document.body.appendChild(script);
        }
    });
};

/**
 * @name isRegistered
 * @description Checks to see if given assembly file is registered
 * @example
 *  isRegistered(file)
 * @params
 *  file: string - full path and name of the assembly file to check for
 * @returns boolean - true/false
 * @throws
 *  InvalidArgumentException
 */ 
flair.Assembly.isRegistered = (file) => {
    if (typeof file !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (file)'); }
    return typeof asmFiles[file] !== 'undefined';
};

/**
 * @name isLoaded
 * @description Checks to see if given assembly file is loaded
 * @example
 *  isLoaded(file)
 * @params
 *  file: string - full path and name of the assembly file to check for
 * @returns boolean - true/false
 * @throws
 *  InvalidArgumentException
 */ 
flair.Assembly.isLoaded = (file) => {
    if (typeof file !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (file)'); }
    return typeof asmFiles[file] !== 'undefined' && asmFiles[file].isLoaded();
};

/**
 * @name get
 * @description Returns assembly object that is associated with given flair type name
 * @example
 *  get(name)
 * @params
 *  name: string - qualified type name of the flair type whose assembly is to be located
 * @returns object - flair assembly type object
 * @throws
 *  InvalidArgumentException
 */ 
flair.Assembly.get = (name) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (name)'); }
    return asmTypes[name] || null;
};

/**
 * @name all
 * @description Returns all registered assembly files
 * @example
 *  all()
 * @params
 *  None
 * @returns array - registered assemblies list
 * @throws
 *  None
 */ 
flair.Assembly.all = () => { 
    return Object.values(asmFiles).slice();
};

/**
 * @name allTypes
 * @description Returns all registered types
 * @example
 *  allTypes()
 * @params
 *  None
 * @returns array - registered types list
 * @throws
 *  None
 */ 
flair.Assembly.allTypes = () => { 
    return Object.keys(asmTypes).slice();
};

// reset api
flair.Assembly._ = {
    reset: () => { asmFiles = {}; asmTypes = {}; }
};

// add to members list
flair.members.push('Assembly');
