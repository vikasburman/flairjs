const fs = await include('fs | x');
const http = await include('http | x');
const https = await include('https | x');
const httpShutdown = await include('http-shutdown | x');

/**
 * @name ExpressServer
 * @description Express Server implementation
 */

$$('ns', '(auto)');
Mixin('(auto)', function() {
    let httpServer = null,
        httpsServer = null,
        httpSettings = settings['server-http'],
        httpsSettings = settings['server-https'];        
    
    $$('override');
    this.start = async (base) => { // configure express http and https server
        base();

        // configure http server
        if (httpSettings.enable) { 
            httpServer = http.createServer(this.app());
            httpServer = httpShutdown(httpServer); // wrap
            httpServer.on('error', (err) => {
                this.error(err);
            }); // pass-through event
            if (httpSettings.timeout !== -1) { httpServer.timeout = httpSettings.timeout; } // timeout must be in milliseconds
        }

        // configure httpS server
        if (httpsSettings.enable) { 
            // SSL Certificate
            // NOTE: For creating test certificate:
            //  > Goto http://www.cert-depot.com/
            //  > Create another test certificate
            //  > Download KEY+PEM files
            //  > Rename *.private.pem as key.pem
            //  > Rename *.public.pem as cert.pem
            //  > Update these files at private folder
            const privateKey  = fs.readFileSync(AppDomain.resolvePath(httpsSettings.privateKey), 'utf8');
            const publicCert = fs.readFileSync(AppDomain.resolvePath(httpsSettings.publicCert), 'utf8');
            const credentials = { key: privateKey, cert: publicCert };

            httpsServer = https.createServer(credentials, this.app());
            httpsServer = httpShutdown(httpsServer); // wrap
            httpsServer.on('error', (err) => {
                this.error(err);
            }); // pass-through event
            if (httpsSettings.timeout !== -1) { httpsServer.timeout = httpsSettings.timeout; } // timeout must be in milliseconds
        }
    };

    $$('override');
    this.ready = (base) => { // start listening express http and https servers
        return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
            base();

            // start server
            let httpPort = httpSettings.port || 80,
                httpsPort = process.env.PORT || httpsSettings.port || 443;
            if (httpServer && httpsServer) {
                httpServer.listen(httpPort, () => {
                    httpsServer.listen(httpsPort, () => {
                        console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (http: ${httpPort}, https: ${httpsPort})`); // eslint-disable-line no-console
                        resolve();
                    });
                });
            } else if (httpServer) {
                httpServer.listen(httpPort, () => {
                    console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (http: ${httpPort})`); // eslint-disable-line no-console
                    resolve();
                });
            } else if (httpsServer) {
                httpsServer.listen(httpsPort, () => {
                    console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (https: ${httpsPort})`); // eslint-disable-line no-console
                    resolve();
                });
            } else {
                console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version}`); // eslint-disable-line no-console
                resolve();
            }
        });
    };

    $$('override');
    this.stop = async (base) => { // graceful shutdown express http and https servers
        base();

        // stop http server gracefully
        if (httpServer) {
            console.log('http server is shutting down...'); // eslint-disable-line no-console
            httpServer.shutdown(() => {
                httpServer = null;
                console.log('http server is cleanly shutdown!'); // eslint-disable-line no-console
            });
        }

        // stop https server gracefully
        if (httpsServer) {
            console.log('https server is shutting down...'); // eslint-disable-line no-console
            httpsServer.shutdown(() => {
                httpsServer = null;
                console.log('https server is cleanly shutdown!'); // eslint-disable-line no-console
            });
        }
    };    
});
