// Assembly
let asmFiles = {},
    asmTypes = {};
flair.Assembly = (ado) => {
    if (typeof ado !== 'object' || Array.isArray(ado.types) || Array.isArray(ado.assets)) {
        throw `Not an assembly definition object.`;
     }
    let asmFile = which(ado.file, true);

    let _asm = {
        name: () => { return ado.name; },
        file: () => { return asmFile; },
        desc: () => { return ado.desc; },
        version: () => { return ado.version; },
        copyright: () => { return ado.copyright; },
        license: () => { return ado.license; },
        isLoaded: () => { return _asm._.isLoaded; },
        types: () => { return ado.types.slice(); },
        settings: () => { return Object.freeze(ado.settings); },
        assets: () => { return ado.assets.slice(); },
        hasAssets: () => { return ado.assets.length > 0; },
        load: () => { return flair.Assembly.load(asmFile); }
    };

    _asm._ = {
        name: ado.name,
        type: 'assembly',
        namespace: null,
        ado: Object.freeze(ado),
        isLoaded: false,
        markLoaded: () => { _asm._.isLoaded = true; }
    };

    // register type with namespace
    flair.Namespace(_asm);

    // return
    return Object.freeze(_asm);
};
flair.Assembly.register = (...ados) => { 
    for(let ado of ados) {
        let asm = flair.Assembly(ado);
        if (asm) {
            let asmFile = asm.file();
            if (asmFiles[asmFile]) {
                throw `Assembly ${asmFile} already registered.`;
            } else {
                // register
                asmFiles[asmFile] = asm;

                // load types
                for(let type of asm.types()) {
                    // qualified names across anywhere should be unique
                    if (asmTypes[type]) {
                        throw `Type ${type} defined in assembly ${asm.name} is already registered.`;
                    } else {
                        asmTypes[type] = asm; // means this type can be loaded from this assembly
                    }
                }
            }
        }
    }
};
flair.Assembly.load = (file) => {
    if (flair.Assembly.isRegistered(file)) {
        return new Promise((resolve, reject) => {
            if (asmFiles[file].isLoaded()) {
                resolve();
            } else {
                if (isServer) {
                    try {
                        require(file);
                        asmFiles[file]._.markLoaded();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    const script = flair.options.env.global.document.createElement('script');
                    script.onload = () => {
                        asmFiles[file]._.markLoaded();
                        resolve();
                    };
                    script.onerror = (e) => {
                        reject(e);
                    };
                    script.async = true;
                    script.src = file;
                    flair.options.env.global.document.body.appendChild(script);
                }
            }
          });
    } else {
        throw `Assembly ${file} must be registered first.`;
    }
};
flair.Assembly.isRegistered = (file) => {
    return typeof asmFiles[file] !== 'undefined';
};
flair.Assembly.isLoaded = (file) => {
    return typeof asmFiles[file] !== 'undefined' && asmFiles[file].isLoaded();
};
flair.Assembly.get = (ofType) => {
    return asmTypes[ofType] || null;
};
flair.Assembly.all = () => { return Object.freeze(asmFiles); }
flair.Assembly.allTypes = () => { return Object.freeze(asmTypes); }
