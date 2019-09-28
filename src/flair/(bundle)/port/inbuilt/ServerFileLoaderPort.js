/**
 * @name ServerFileLoaderPort
 * @description Default server file loading implementation
 */
const ServerFileLoaderPort = function() {
    this.name = 'serverFile';

    this.load = async (file) => {
        const serverFileLoader = () => {
            return new Promise((resolve, reject) => {
                if (typeof file !== 'string') { reject(_Exception.InvalidArgument('file')); return; }
    
                let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
                try {
                    let httpOrhttps = null,
                        body = '';
                    if (file.startsWith('https')) {
                        httpOrhttps = require('https');
                    } else {
                        httpOrhttps = require('http'); // for urls where it is not defined
                    }
                    httpOrhttps.get(file, (resp) => {
                        resp.on('data', (chunk) => { body += chunk; });
                        resp.on('end', () => { 
                            let contentType = resp.headers['content-type'];
                            if (ext === 'json' || /^application\/json/.test(contentType)) { // special case of JSON
                                try {
                                    let data = JSON.parse(body);
                                    resolve(data);
                                } catch (err) {
                                    reject(new _Exception(err));
                                }
                            } else { // everything else is a text
                                resolve(body);
                            }
                        });
                    }).on('error', (err) => {
                        reject(new _Exception(err));
                    });
                } catch(err) {
                    reject(new _Exception(err));
                }
            });  
        };

        return await serverFileLoader();
    };
};
