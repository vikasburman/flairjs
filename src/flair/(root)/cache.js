const { Attribute } = ns();

/**
 * @name cache
 * @description Caching custom attribute
 * $$('cache', { 'duration': 10000 }) OR $$('cache', 10000)
 */
$$('ns', '(auto)');
Class('(auto)', Attribute, function() {
    $$('override');
    this.construct = (base, cacheConfig) => {
        base(cacheConfig);

        // config
        this.cacheConfig = (typeof cacheConfig === 'number' ? { duration: cacheConfig } : cacheConfig)
        this.enabled = (this.cacheConfig && this.cacheConfig.duration);
        this.cacheHandler = Port('cacheHandler');

        // constraints
        this.constraints = '(class || struct) && (func && async) && !(timer || on || @fetch || @cache)';
    };

    $$('readonly');
    this.cacheConfig = null;

    $$('private');
    this.cacheHandler = null;

    $$('private');
    this.enabled = false;

    $$('override');
    this.decorateFunction = (base, typeName, memberName, member) => { // eslint-disable-line no-unused-vars
        let _this = this,
            cacheId = `${typeName}___${memberName}`;

        let callMember = async (...args) => {
            let resultData = await member(...args);
            if (_this.enabled) { // save for later
                await _this.cacheHandler.set(cacheId, _this.cacheConfig, resultData);
            }
            return resultData;
        };

        // decorated function
        return async function(...args) {
            if (_this.enabled) {
                try {
                    return await _this.cacheHandler.get(cacheId, _this.cacheConfig);
                } catch (err) { // eslint-disable-line no-unused-vars
                    // ignore and move forward by calling callMember below
                }
            }
            return await callMember(...args);
        };
    };
});
