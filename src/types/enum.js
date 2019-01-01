// Enum
// Enum(enumName, {key: value})
flair.Enum = (enumName, keyValuePairsOrArray) => {
    let _enum = keyValuePairsOrArray;
    if (Array.isArray(keyValuePairsOrArray)) {
        let i = 0;
        _enum = {};
        for(key of keyValuePairsOrArray) {
            _enum[key] = i;
            i++;
        }
    } 
    _enum._ = {
        name: enumName,
        type: 'enum',
        package: null,        
        keys: () => {
            let items = [];
            for(let i in keyValuePairs) {
                if (keyValuePairs.hasOwnProperty(key) && key !== '_') {
                    items.push(key);
                }
            }
            return items;
        },
        values: () => {
            let items = [];
            for(let key in keyValuePairs) {
                if (keyValuePairs.hasOwnProperty(key) && key !== '_') {
                    items.push(keyValuePairs[key]);
                }
            }
            return items;
        }
    };

    // register type with package
    flair.Package(_enum);

    // return
    return Object.freeze(_enum);
};
flair.Enum.getKeys = (enumObj) => {
    if (enumObj._ && enumObj._.type === 'enum') {
        return enumObj._.keys();
    }
    enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
    throw `${enumName} is not an Enum.`;
};
flair.Enum.getValues = (enumObj) => {
    if (enumObj._ && enumObj._.type === 'enum') {
        return enumObj._.values();
    }
    enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
    throw `${enumName} is not an Enum.`;
};
flair.Enum.isDefined = (enumObj, keyOrValue) => {
    if (enumObj._ && enumObj._.type === 'enum') {
        return (enumObj._.keys.indexOf(keyOrValue) !== -1 || enumObj._.values.indexOf(keyOrValue) !== -1) ? true : false;
    }
    enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
    throw `${enumName} is not an Enum.`;
};
