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
 */ 
flair.Assembly = (ado) => {
    if (typeof ado !== 'object') { throw _Exception.InvalidArgument('ado'); }
    if (_typeOf(ado.types) !== 'array' || 
        _typeOf(ado.assets) !== 'array' ||
        typeof ado.name !== 'string' ||
        typeof ado.file !== 'string') {
        throw _Exception.InvalidArgument('ado');
    }
  
    // define assembly structure
    let _Assembly = flair.Struct('Assembly', function() {
        this.construct((ado) => {
            this.ado = ado;
            this.name = ado.name;
            this.file = which(ado.file, true); // min/dev contextual pick
            this.desc = ado.desc || '';
            this.version = ado.version || '';
            this.copyright = ado.copyright || '';
            this.license = ado.license || '';
            this.types = ado.types.slice() || [];
            this.settings = ado.settings || {};
            this.assets = ado.assets.slice() || [];
            this.hasAssets = (ado.assets.length > 0);
        });
        
        /// TODO: props is no longer supported
        this.props(['readonly'], ['ado', 'name', 'file', 'desc', 'version', 'copyright', 'license', 'types', 'hasAssets']);
        
        this.prop('isLoaded', false);
        this.func('load', () => {
            return flair.Assembly.load(this.file);
        });
        this.func('getType', (name) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (!this.isLoaded) { throw new _Exception('NotLoaded', `Assembly is not yet loaded. (${this.file})`); }
            if(this.types.indexOf(name) === -1) { throw new _Exception('NotFound', `Type is not found in this assembly. (${name})`); }
            let Type = flair.Namespace.getType(name);
            if (!Type) { throw new _Exception('NotRegistered', `Type is not registered. (${name})`); }
            return Type;
        });
        this.func('createInstance', (name, ...args) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            let Type = flair.Assembly.get(name),
                obj = null;
            if (args) {
                obj = new Type(...args);
            } else {
                obj = new Type();
            }
            return obj;
        });
    });

    // return
    return new _Assembly(ado);
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
 *  DuplicateNameException
 */ 
flair.Assembly.register = (...ados) => { 
    if (!ados) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (ados)'); }

    let success = false;
    for(let ado of ados) {
        let asm = flair.Assembly(ado),
            asmFile = asm.file;
        if (asmFiles[asmFile]) {
            throw new _Exception('DuplicateName', `Assembly is already registered. (${asmFile})`);
        } else {
            // register
            asmFiles[asmFile] = asm;

            // load types
            for(let type of asm.types) {
                // qualified names across anywhere should be unique
                if (asmTypes[type]) {
                    throw new _Exception('DuplicateName', `Type is already registered. (${type})`);
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
 *  NotFoundException
 *  FileLoadException
 */
flair.Assembly.load = (file) => {
    return new Promise((resolve, reject) => {
        if (typeof file !== 'string') { reject(new _Exception('InvalidArgument', 'Argument type is invalid. (file)')); return; }
        if (!flair.Assembly.isRegistered(file)) { reject(new _Exception('NotFound', `Assembly is not registered. (${file})`)); return; }

        if (asmFiles[file].isLoaded) { resolve(); return; }
            
        if (isServer) {
            try {
                require(file);
                asmFiles[file].markLoaded();
                resolve();
            } catch (e) {
                reject(new _Exception('FileLoad', `File load operation failed. (${file})`, e));
            }
        } else {
            const script = flair.options.env.global.document.createElement('script');
            script.onload = () => {
                asmFiles[file].isLoaded = true;
                resolve();
            };
            script.onerror = (e) => {
                reject(new _Exception('FileLoad', `File load operation failed. (${file})`, e));
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
    return typeof asmFiles[file] !== 'undefined' && asmFiles[file].isLoaded;
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

const _Assembly = flair.Assembly; // TODO: To fix
