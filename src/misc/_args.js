const _Args = function(...patterns) {
   let _args = (...args) => {
        // each pattern is an expected set of types - like what method overload options
        // with data types, e.g., a function can have following 4 ways of accepting parameters
        // name1: string
        // name1: string, name2: string
        // name3: object
        // name3: object, name4: string
        // it will process each combination against give args and if none of the pattern matches
        // or more than one parameter matches, it will throw exceptions
        // it will return the pattern index that matches
        // and will set this[argName] to their values
        // note, special names like raw, count, define cannot be defined names
        if (args.length === 0) { throw new _Exception('InvalidArgument', 'Argument must be defined. (patterns)'); }

        // process each pattern - exit with first matching pattern
        let types, items = null,
            name, type = '',
            pIndex = -1,
            aIndex = -1,
            matched = false,
            mCount = 0,
            values = {
                raw: args || [],
                count: args.length,
                type: -1,
                isInvalid: () => { return values.type === -1; }
            };
        for(let pattern of patterns) {
            pIndex++; aIndex=-1; matched = false; mCount = 0;
            types = pattern.split(',');
            for(let item of types) {
                aIndex++;
                items = item.split(':');
                if (items.length !== 2) { 
                    name = pIndex.toString() + '_' + aIndex.toString();
                    type = item.trim() || '';
                } else {
                    name = items[0].trim() || '',
                    type = items[1].trim() || '';
                }
                if (!name || !type) { throw new _Exception('InvalidArgument', `Argument pattern must contain both name and type. (${pattern})`); }
                if (['raw', 'count', 'type'].indexOf(name) !== -1) { throw new _Exception('InvalidArgument', `Argument name cannot be a reserved name. (${name})`); }
                if (aIndex > values.count) { matched = false; break; }
                if (typeof values.raw[aIndex] != type) { matched = false; break; }
                values[name] = values.raw[aIndex]; matched = true; mCount++;
            }
            if (matched && mCount === values.count) {values.type = pIndex; break; }
        }

        // return
        return values;
    };

    // return freezed
    return Object.freeze(_args);
};