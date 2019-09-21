/**
 * @name Resource
 * @description Resource object.
 */ 
const Resource = function(rdo, ns, alc) {
    this.context = alc;

    this.name = rdo.name;
    this.ns = ns;
    this.assembly = () => { return alc.getAssembly(which(rdo.asmFile)) || null; };
    this.encodingType = rdo.encodingType;
    this.file = rdo.file;
    this.type = rdo.file.substr(rdo.file.lastIndexOf('.') + 1).toLowerCase();
    this.data = rdo.data;

    try {
        // decode data (rdo.data is base64 encoded string, added by build engine)
        if (rdo.encodingType.indexOf('utf8;') !== -1) {
            if (isServer) {
                let buff = Buffer.from(rdo.data, 'base64');
                this.data = buff.toString('utf8');
            } else { // client
                this.data = b64DecodeUnicode(rdo.data); 
            }
        } else { // binary
            if (isServer) {
                this.data = Buffer.from(rdo.data, 'base64');
            } // else no change on client
        }
    } catch (err) {
        throw _Exception.OperationFailed(`Resource data could not be decoded. (${rdo.name})`, Resource);
    }

    // special case of JSON
    if (this.type === 'json') {
        this.data = Object.freeze(JSON.parse(this.data));
    }
};
