/**
 * @name ClientFileLoaderPort
 * @description Default client file loading implementation
 */
const ClientFileLoaderPort = function() {
    this.name = 'clientFile';

    this.load = async (file) => {
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file'); }
        
        let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
        let response = await fetch(file);
        if (!response.ok) { throw _Exception.OperationFailed(file, response.status); }
            
        let contentType = response.headers['content-type'];
        if (ext === 'json' || /^application\/json/.test(contentType)) { // special case of JSON
            return response.json();
        } else { // everything else is a text
            return response.text();
        }       
    };
};
