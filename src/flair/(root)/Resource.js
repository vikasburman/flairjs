/**
 * @name Resource
 * @description Resource wrapper class.
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', function() {
    const b64EncodeUnicode = (str) => { // eslint-disable-line no-unused-vars
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
        }));
    };
    const b64DecodeUnicode = (str) => {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    };    

    this.construct = (name, locale, encodingType, file, data) => {
        let resData = data; // data is base64 encoded string, added by build engine
        let resType = file.substr(file.lastIndexOf('.') + 1).toLowerCase();

        // decode
        if (encodingType.indexOf('utf8;') !== -1) {
            if (isServer) {
                let buff = new Buffer(resData).toString('base64');
                resData = buff.toString('utf8');
            } else { // client
                resData = b64DecodeUnicode(resData); 
            }
        } else { // binary
            if (isServer) {
                resData = new Buffer(resData).toString('base64');
            } else { // client
                // no change, leave it as is
            }
        }

        // store
        this.locale = locale;
        this.encodingType = encodingType;
        this.file = file;
        this.type = resType;
        this.data = resData;
    };

   /** 
    *  @name name: string - name of the resource
    */
    $$('readonly');
    this.name = '';

   /** 
    *  @name locale: string - locale of the resource
    */
   $$('readonly');
   this.locale = '';


   /** 
    *  @name locale: string - locale of the resource
    */
   $$('readonly');
   this.locale = '';   

   /** 
    *  @name encodingType: string - resource encoding type
    */
    $$('readonly');
    this.encodingType = '';
   
   /** 
    *  @name type: string - resource type
    */
    $$('readonly');
    this.type = '';

   /** 
    *  @name data: string - resource data
    */
   $$('readonly');
   this.data = '';
});
