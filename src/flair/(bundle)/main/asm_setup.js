// get current file
let currentFile = (isServer ? __filename : (isWorker ? self.location.href : getLoadedScript('flair.js', 'flair.min.js')));

// info
flair.info = Object.freeze({
    name: '<<name>>',
    title: '<<title>>',
    desc: '<<desc>>',
    asm: '<<asm>>',
    file: currentFile,
    version: '<<version>>',
    copyright: '<<copyright>>',
    license: '<<license>>',
    lupdate: new Date('<<lupdate>>')
});  

// bundled assembly load process 
let file = which('<<which_file>>');
_AppDomain.context.current().loadBundledAssembly(file, currentFile, (flair, __asmFile) => {
    // NOTES: 
    // 1. Since this is a custom assembly index.js file, types built-in here does not support 
    //    await type calls, as this outer closure is not an async function

    <<asm_payload>>
});

// set settings and config for uniform access anywhere in this closure
let asm = _getAssembly('[flair]');
settings = asm.settings();
config = asm.config();

// return
return Object.freeze(flair);