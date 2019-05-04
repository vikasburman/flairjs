// const fs = await include('fs | x');
// const http = await include('http | x');
// const https = await include('https | x');
// const httpShutdown = await include('http-shutdown | x');

/**
 * @name FirebaseServer
 * @description Firebase Server implementation
 */

$$('ns', '(auto)');
Mixin('(auto)', function() {
    
    $$('override');
    this.start = async (base) => { 
        base();


    };

    $$('override');
    this.ready = (base) => { 
        base();

    };

    $$('override');
    this.stop = async (base) => { 
        base();


    };    
});
