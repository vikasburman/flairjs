//
// define all inbuilt port definitions
//

//  clientModule {
//      require: async (module)
//      undef: (module)
//  }
//  module: module to load or undef
_Port.define('clientModule', ['require', 'undef']);

//  serverModule {
//      require: async (module)
//      undef: (module)
//  }
//  module: module to load or undef
_Port.define('serverModule', ['require', 'undef']);

//  clientFile {
//      load: async (file)
//  }
//  file: file to load
_Port.define('clientFile', ['load']);

//  serverFile {
//      load: async (file)
//  }
//  file: file to load
_Port.define('serverFile', ['load']);

//  settingsReader {
//      read: (asmName)
//  }
//  asmName: assembly name to read settings for
_Port.define('settingsReader', ['read']);

//
// connect all inbuilt port implementations
//

let list = [];
list.push(options.env.isServer ? ServerModuleLoaderPort : ClientModuleLoaderPort);
list.push(options.env.isServer ? ServerFileLoaderPort : ClientFileLoaderPort);
list.push(SettingsReaderPort);

for(let ph of list) {
    _Port.connect(new ph());
}
