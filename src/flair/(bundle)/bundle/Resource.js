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
        let Resource = _getType('Resource');
        resources_registry[name] = new Resource(name, locale, encodingType, file, data);
    },

    // get registered resource
    get: (name) => {
        return resources_registry[name] || null;
    }
};

// attach to flair
a2f('Resource', _Resource, () => {
    resources_registry = {};
});
