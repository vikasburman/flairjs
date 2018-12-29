// Assembly
// Assembly(asmName)
oojs.Assembly = (asmName) => {
    let _asm = {};
    _asm._ = {
        name: asmName,
        type: 'assembly'
    };

    

    // return
    return Object.freeze(_asm);
};

