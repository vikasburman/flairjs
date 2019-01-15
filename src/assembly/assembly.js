// Assembly
let asmFiles = {},
    asmTypes = {};
flair.Assembly = () => {};
flair.Assembly.register = (...ados) => { 
    // each ADO is an Assembly Definition Object with following structure:
    // {
    //      "name": "", 
    //      "file": "",
    //      "assets": "",
    //      "desc": "",
    //      "version": "",
    //      "copyright": "",
    //      "license": "",
    //      "types": ["", "", ...]
    // }

    for(let asm of ados) {
        if (typeof asm !== 'object' || Array.isArray(asm.type)) { continue; }

        // load assembly
        let asmFile = flair.which(asm.file, true);
        if (asmFiles[asmFile]) {
            throw `Assembly ${asmFile} already registered.`;
        } else {
            asmFiles[asmFile] = {
                ado: asm,
                status: 'not-loaded' // by default file is not loaded as yet
            };
        }

        // load types
        for(let type of asm.types) {
            // qualified names across anywhere should be unique
            if (asmTypes[type]) {
                throw `Type ${type} already registered.`;
            } else {
                asmTypes[type] = asmFile; // means this type can be loaded from this assembly file
            }
        }
    }
};
flair.Assembly.isRegistered = (file) => {
    return typeof asmFiles[file] !== 'undefined';
}
flair.Assembly.load = (file) => {
    if (flair.Assembly.isRegistered(file)) {
        return new Promise((resolve, reject) => {
            if (asmFiles[file] === 'loaded') {
                resolve();
            } else {
                if (isServer) {
                    try {
                        require(file);
                        asmFiles[file].status = 'loaded';
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    const script = document.createElement('script');
                    script.onload = () => {
                        asmFiles[file].status = 'loaded';
                        resolve();
                    };
                    script.onerror = (e) => {
                        reject(e);
                    };
                    script.async = true;
                    script.src = file;
                    document.body.appendChild(script);
                }
            }
          });
    } else {
        throw `Assembly ${file} must be registered first.`;
    }
};
flair.Assembly.isLoaded = (file) => {
    return typeof asmFiles[file] !== 'undefined' && asmFiles[file].status === 'loaded';
};
flair.Assembly.get = (type) => {
    return asmTypes[type] || ''; // name of the file where this type is bundled, else ''
};