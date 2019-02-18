/**
 * @name Assembly
 * @description Assembly registration and locator functionality.
 * @example
 *  .register(...ados)          // - void
 *  .get(typeName)              // - assembly object or null
 *  .all()                      // - array of all registered assemblies
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
 * typeName: string - qualified type name for which assembly object is needed
 */ 
let asmFiles = {}, asmTypes = {};
const _Assembly = {
    // register one or more assemblies as per given Assembly Definition Objects
    register: (...ados) => {
        if (!ados) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (ados)'); }

        ados.forEach(ado => {
            let asm = new __Assembly(ado),
                asmFile = asm.file;
            if (asmFiles[asmFile]) {
                throw new _Exception('DuplicateName', `Assembly is already registered. (${asmFile})`);
            } else {
                // register
                asmFiles[asmFile] = asm;

                // load types
                asm.types.forEach(type => {
                    // qualified names across anywhere should be unique
                    if (asmTypes[type]) {
                        throw new _Exception('DuplicateName', `Type is already registered. (${type})`);
                    } else {
                        asmTypes[type] = asm; // means this type can be loaded from this assembly Assembly.get() give this only
                    }
                });
            }
        });
    },

    // returns assembly object that is associated with given flair type name
    get: (typeName) => {
        if (typeof typeName !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (typeName)'); }
        return asmTypes[typeName] || null;
    },

    // returns all registered assembly objects
    all: () => {
        return Object.values(asmFiles).slice();
    }
};
const __Assembly = function (ado) {
    if (typeof ado !== 'object') { throw _Exception.InvalidArgument('ado'); }
    if (_typeOf(ado.types) !== 'array' || 
        _typeOf(ado.assets) !== 'array' ||
        typeof ado.name !== 'string' ||
        typeof ado.file !== 'string' || ado.file === '') {
        throw _Exception.InvalidArgument('ado');
    }
    let isLoaded = false;
    let _this = {
        // pick all ado properties as is
        ado: ado,
        name: ado.name,
        file: which(ado.file, true), // min/dev contextual pick
        desc: ado.desc || '',
        version: ado.version || '',
        copyright: ado.copyright || '',
        license: ado.license || '',
        types: Object.freeze(ado.types.slice()),
        settings: Object.freeze(ado.settings || {}),
        assets: Object.freeze(ado.assets.slice()),
        hasAssets: (ado.assets.length > 0),
        
        isLoaded: () => { return isLoaded; },
        load: () => { 
            return new Promise((resolve, reject) => {
                if (isLoaded) { resolve(); return; }
                loadModule(_this.file).then(() => { // since we want this js to be loaded and executed
                    isLoaded = true;
                    resolve();
                }).catch((e) => {
                    reject(new _Exception('ModuleLoad', `Module load operation failed. (${_this.file})`, e));
                });
            });
        }
    };

    // return
    return Object.freeze(_this);
};

// attach to flair
a2f('Assembly', _Assembly, () => {
    asmFiles = {}; asmTypes = {};
});
