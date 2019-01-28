const _Args = (...patterns) => {
    if (patterns.length === 0) { throw new _Exception('InvalidArgument', 'Argument must be defined. (patterns)'); }

    /**
     * @description Args validator function that validates against given patterns
     * @example
     *  (...args)
     * @params
     *  args: any - multiple arguments to match against given pattern sets
     * @returns result object, having:
     *  raw: (array) - original arguments as passed
     *  index: (number) - index of pattern-set that matches for given arguments, -1 if no match found
     *                    if more than one patterns may match, it will stop at first match
     *  isInvalid: (function) - function to check if any match could not be achieved
     *  <name(s)>: <value(s)> - argument name as given in pattern having corresponding argument value
     *                          if a name was not given in pattern, a default unique name will be created
     *                          special names like 'raw', 'index' and 'isInvalid' cannot be used.
     */    
    let _args = (...args) => {
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
                    if (['raw', 'index', 'isInvalid'].indexOf(name) !== -1) { throw new _Exception('InvalidArgument', `Argument name cannot be a reserved name. (${name})`); }
                    if (aIndex > result.raw.length) { matched = false; break; }
                    if (!_is(result.raw[aIndex], type)) { matched = false; break; }
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