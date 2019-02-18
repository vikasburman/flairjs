/**
 * @name Resource
 * @description Resource registration and locator functionality.
 * @example
 *  .register(name, locale, encodingType, file, data)               // - void
 *  .get(name)                                                      // - resource object
 * @params
 *  name: string - qualified name of resource
 *  locale: string - locale of the resource or empty, if no locale is associated
 *  encodingType: string - type of encoding applied to resource data
 *  file: string - resource file name and path
 *  data: string - base 64 encoded (or binary) data of resource
 *  typeName: string - qualified type name for which assembly object is needed
 */ 
let resources_registry = {};
const _Resource = {
    // register resource
    register: (name, locale, encodingType, file, data) => {
        if (resources_registry[name]) { throw new _Exception('AlreadyRegistered', 'Resource is already registered'); }
        resources_registry[name] = new __Resource(name, locale, encodingType, file, data);
    },

    // get registered resource
    get: (name) => {
        return resources_registry[name] || null;
    }
};

_$$('sealed');
_$$('ns', '(root)');
const __Resource = _Class('Resource', function() {
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
    _$$('readonly');
    this.name = '';

   /** 
    *  @name locale: string - locale of the resource
    */
   _$$('readonly');
   this.locale = '';


   /** 
    *  @name locale: string - locale of the resource
    */
   _$$('readonly');
   this.locale = '';   

   /** 
    *  @name encodingType: string - resource encoding type
    */
    _$$('readonly');
    this.encodingType = '';
   
   /** 
    *  @name type: string - resource type
    */
    _$$('readonly');
    this.type = '';

   /** 
    *  @name data: string - resource data
    */
   _$$('readonly');
   this.data = '';
});

// attach to flair
a2f('Resource', _Resource, () => {
    resources_registry = {};
});
