// _Args
// _Args(...patterns)
const _Args = function(...patterns) {
    if (patterns.length === 0) { throw new _Exception('InvalidArgument', 'Argument must be defined. (patterns)'); }

    let _args = (...args) => {
        // each pattern is an expected set of type names - like what method overload options
        // with data types, e.g., a function can have following 4 ways of accepting parameters
        // name1: string
        // name1: string, name2: string
        // name3: object
        // name3: object, name4: string
        // it will process each combination against give args and if none of the pattern matches
        // it will set index as -1, it there are more than one matches, it will stop at first match
        // it will set pattern index that matches
        // and will set [argName] to their values
        // note, special names like raw, index cannot be defined names

        // process each pattern - exit with first matching pattern
        let types = null, items = null,
            name = '', type = '',
            pIndex = -1, aIndex = -1,
            matched = false,
            mCount = 0,
            result = {
                raw: args || [],
                index: -1,
                isInvalid: () => { return result.index === -1; }
            };
        if (patterns) {
            for(let pattern of patterns) {
                pIndex++; aIndex=-1; matched = false; mCount = 0;
                types = pattern.split(',');
                for(let item of types) {
                    aIndex++;
                    items = item.split(':');
                    if (items.length !== 2) { 
                        name = `_${pIndex}_${aIndex}`; // e.g., _0_0 or _1_2, etc.
                        type = item.trim() || '';
                    } else {
                        name = items[0].trim() || '',
                        type = items[1].trim() || '';
                    }
                    if (['raw', 'index'].indexOf(name) !== -1) { throw new _Exception('InvalidArgument', `Argument name cannot be a reserved name. (${name})`); }
                    if (aIndex > result.raw.length) { matched = false; break; }
                    if (typeof result.raw[aIndex] != type) { matched = false; break; }
                    result[name] = result.raw[aIndex]; matched = true; mCount++;
                }
                if (matched && mCount === result.raw.length) {result.index = pIndex; break; }
            }
        }

        // return
        return result;
    };

    // return freezed
    return Object.freeze(_args);
};