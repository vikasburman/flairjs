// Assembly
// Assembly(asmName, {namespace: member})
oojs.Assembly = (asmName, nestedStructure) => {
    let _asm = nestedStructure;
    _asm._ = {
        name: asmName,
        type: 'assembly'
    };

    // return
    return Object.freeze(_asm);
};
