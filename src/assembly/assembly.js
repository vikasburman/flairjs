// Assembly
let asmFiles = {},
    asmTypes = {};
flair.Assembly = () => {};
flair.Assembly.register = (file, types) => { 
    // load assembly
    if (asmFiles[file]) {
        throw `Assembly ${file} already registered.`;
    } else {
        asmFiles[file] = 'not-loaded'; // by default file is not loaded as yet
    }

    // load types
    for(let type of asmTypes) {
        // qualified names across anywhere should be unique
        if (asmTypes[type]) {
            throw `Type ${type} already registered.`;
        } else {
            asmTypes[type] = file; // means this type can be loaded from this assembly file
        }
    }
};
flair.Assembly.registerMany = (fileAndTypes) => {
    // array of { file: 'path/bundled-file.js', types: ['contained-type1', 'contained-type2', ...] }
    for(let asm of fileAndTypes) {
        flair.Assembly.register(asm.file, asm.types);
   }
};
flair.Assembly.isRegistered = (file) => {
    return typeof asmFiles[file] !== 'undefined';
}
flair.Assembly.load(file) => {
    if (flair.Assembly.isRegistered(file)) {
        return new Promise((resolve, reject) => {
            if (asmFiles[file] === 'loaded') {
                resolve();
            } else {
                if (isServer) {
                    try {
                        require(file);
                        asmFiles[file] = 'loaded';
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    const script = document.createElement('script');
                    script.onload = () => {
                        asmFiles[file] = 'loaded';
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
flair.Assembly.isLoaded(file) => {
    return typeof asmFiles[file] !== 'undefined' && asmFiles[file] === 'loaded';
};
flair.Assembly.get(type) => {
    return asmTypes[type] || ''; // name of the file where this type is loaded, else ''
};