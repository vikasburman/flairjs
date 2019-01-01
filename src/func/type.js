// type
// type(qualifiedName)
//  qualifiedName: qualifiedName of type to get
flair.type = (qualifiedName) => {
    let _Type = flair.Package.getType(qualifiedName);
    if (!_Type) { throw `${qualifiedName} is not loaded.`; }
    return _Type;
};