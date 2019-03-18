const { Bootware } = ns('flair.app');

/**
 * @name ResHeaders
 * @description Express Response Header Settings (Common to all routes)
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('Server Response Headers', true); // mount specific
    };

    $$('override');
    this.boot = async (mount) => {
        let resHeaders = settings[`${mount.name}-resHeaders`];
        if (resHeaders && resHeaders.length > 0) {
            mount.app.use((req, res, next) => {
                // each item is: { name: '', value:  }
                // name: standard header name
                // value: header value
                for(let header of resHeaders) {
                    res.setHeader(header.name, header.value);
                }
                next();
            });         
        }
    };
});
