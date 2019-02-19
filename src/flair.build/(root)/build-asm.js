/**
 * @preserve
 * <title> - Assembly Builder
 * <desc>
 * Version <version>
 * <datetime>
 * <copyright>
 * <license>
 * <link>
 */

 // eslint-disable-next-line for-direction
const rrd = require('recursive-readdir-sync');  // eslint-disable-line getter-return
const copyDir = require('copy-dir');
const path = require('path');
const fsx = require('fs-extra');
const del = require('del');
const CLIEngine = new require("eslint").CLIEngine
const uglifyjs = require('uglify-js-harmony');

let uglifyConfig, 
    eslintConfig,
    depsConfig,
    packageJSON, 
    eslint, 
    eslintFormatter = null;

let getFolders = (root, excludeRoot) => {
  const _getFolders = () => {
      return fsx.readdirSync(root)
          .filter((file) => {
              return fsx.statSync(path.join(root, file)).isDirectory();
      });
  }
  if (excludeRoot) {
      return _getFolders();
  } 
  return ['/'].concat(_getFolders());
};
let delAll = (root) => {
  del.sync([root + '/**', '!' + root]);
};
const copyDeps = (deps, done) => {
    const processNext = (items) => {
        if (items.length !== 0) {
            let item = items.shift(); // {src, dest}
            if (item.src.startsWith('http')) {
                let httpOrhttps = null,
                    body = '';
                if (item.src.startsWith('https')) {
                    httpOrhttps = require('https');
                } else {
                    httpOrhttps = require('http'); // for urls where it is not defined
                }
                httpOrhttps.get(item.src, (resp) => {
                    resp.on('data', (chunk) => { body += chunk; });
                    resp.on('end', () => { 
                        fsx.ensureFileSync(item.dest);
                        fsx.writeFileSync(item.dest, body, 'utf8');
                        processNext(items);
                    });
                }).on('error', (e) => {
                    throw `Failed to fetch dependency: ${item.src}. \n\n ${e}`;
                });
            } else { // local file / folder path
                if (fsx.lstatSync(item.src).isDirectory()) {
                    copyDir.sync(item.src, item.dest);
                } else {
                    fsx.copyFileSync(item.src, item.dest);
                }
                processNext(items);
            }
        } else {
            // done
            done();
        }
    };

    processNext(deps.slice());
};
const guid = () => { 
    return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });        
};
const escapeRegExp = (string) => {
    return string.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, '\\$1'); // eslint-disable-line no-useless-escape
};
const replaceAll = (string, find, replace) => {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};
const injector = (basepath, content) => {
    // Unescaped \s*([\w@_\-.\\\/]+)\s*
    const FILENAME_PATTERN = '\\s*([\\w@_\\-.\\\\/]+)\\s*';
    const FILENAME_MARKER = '<filename>';
    const DEFAULT_PATTERN = '<!--\\s*inject:<filename>-->';
  
    const injectPattern = '^([ \\t]*)(.*?)' + DEFAULT_PATTERN.replace(FILENAME_MARKER, FILENAME_PATTERN);
    const regex = new RegExp(injectPattern, 'm');
    let fileName, textBefore, whitespace, currMatch, match;
  
    while ((currMatch = regex.exec(content))) {
        match = currMatch[0];
        whitespace = currMatch[1];
        textBefore = currMatch[2];
        fileName = currMatch[3];

        var injectContent = whitespace + textBefore +
                            fsx.readFileSync(basepath + '/' + fileName, 'utf8').split(/\r?\n/)
                            .map((line, i) => {
                                return (i > 0) ? whitespace + line : line
                            }).join('\n');
        content = content.replace(match, function () { return injectContent })
    }
    
    return content;
};


// do
const doTask = (srcList, srcRoot, destRoot, utf8EncResFileTypes, done) => {
   // append text to file
    const appendToFile = (asm, text, isAppend = true) => {
        if (isAppend) {
            fsx.writeFileSync(asm, text, {flag: 'a'});
        } else {
            fsx.writeFileSync(asm, text);
        }
    };  

    // append assembly header
    const appendHeader = (asm, asmName) => {
        let header = 
        `/**\n`+
        ` * ${packageJSON.title}\n` +
        ` * ${packageJSON.description}\n` +
        ` * \n` +
        ` * Assembly: ${asmName}\n` +
        ` *     File: ${asm}\n` +
        ` *  Version: ${packageJSON.version}\n` +
        ` *  ${new Date().toUTCString()}\n` +
        ` * \n` +
        ` * ${packageJSON.copyright}\n` +
        ` * ${packageJSON.license}\n` +
        ` */\n`;
        appendToFile(asm, header);
    };

   // append ADO
    const appendADO = (ados, asm, asmName) => { // eslint-disable-line no-unused-vars
        // each ADO object has:
        //      "name": "", 
        //      "file": "",
        //      "desc": "",
        //      "version": "",
        //      "copyright": "",
        //      "license": "",
        //      "types": ["", "", ...],
        //      "resources": ["", "", ...],
        //      "assets": ["", "", ...],
        //      "settings: {}"
        let ADO = {
            name: asmName,
            file: asm.replace('.js', '{.min}.js'),
            desc: packageJSON.description,
            version: packageJSON.version,
            copyright: packageJSON.copyright,
            license: packageJSON.license,
            types: [],
            resources: [],
            assets: [],
            settings: {}
        };
        ados.push(ADO);
        return ADO;
    };

    // copy assets
    const copyAssets = (ado, assets_src, assets_dest) => {
        if (!fsx.existsSync(assets_src)) { 
            console.log('  assets: (not found)');
            return; 
        }

        // ensure dest folder exists
        fsx.ensureDirSync(assets_dest);

        // copy all assets and add to assets list as well
        copyDir.sync(assets_src, assets_dest, function(stat, filepath, filename){
            if (stat === 'file') { 
                // add to ado
                ado.assets.push(filepath); 
            
                // log
                console.log('  asset: ' + filepath); // eslint-disable-line no-console
            }
            return true;
        }, function (err) { throw err; });

        // TODO: destFile.replace(dest, '.')
    };

    const appendSettings = (ado, file) => {
        if (fsx.existsSync(file)) {
            // log
            console.log(' settings: ' + file); // eslint-disable-line no-console

            // register with ado
            ado.settings = JSON.parse(fsx.readFileSync(file));
        } else {
            // log
            console.log(' settings: (not found)'); // eslint-disable-line no-console
        }
    };

    // append resource
    const appendResource = (ado, asm, file, qualifiedName) => {
        let content = '',
            encodingType = '',
            ext = path.extname(file).toLowerCase();

        // validate for duplicate
        if (ado.resources.indexOf(qualifiedName) !== -1) { throw `Resource is already added to assembly. (${qualifiedName})`; }

        // add to ado
        ado.resources.push(qualifiedName);

        // read file
        if (utf8EncResFileTypes.indexOf(ext) === -1) { // utf8 encoding resFileTypes must contain extension names with a .
            content = fsx.readFileSync(file, 'utf8');
            encodingType = 'utf8;';
        } else { // no encoding
            content = fsx.readFileSync(file);
            encodingType = '';
        }
        content = new Buffer(content).toString('base64');
        encodingType += 'base64;';

        // add to file
        let dump = `;flair.Resource.register("${qualifiedName}", "${encodingType}", "${file}", "${content}");`;
        appendToFile(asm, dump);

        // log
        console.log('    res: ' + qualifiedName + ' (' +  file + ')'); // eslint-disable-line no-console
    };

    // append type
    const appendType = (ado, asm, file, basepath, nsName, typeName, qualifiedName) => {
        // validate for duplicate
        if (ado.types.indexOf(qualifiedName) !== -1) { throw `Type is already added to assembly. (${qualifiedName})`; }

        // add to ado
        ado.types.push(qualifiedName);

        // copy file content
        let content = fsx.readFileSync(file, 'utf8');

        // find and replace namespace name if set for auto
        content = replaceAll(content, `$$('ns', '(auto)');`, `$$('ns', '${nsName}');`);
        content = replaceAll(content, `$$("ns", "(auto)");`, `$$("ns", "${nsName}");`);

        // find and replace typename name if set for auto
        content = replaceAll(content, `Class('(auto)'`, `Class('${typeName}'`);
        content = replaceAll(content, `Class("(auto)"`, `Class("${typeName}"`);

        content = replaceAll(content, `Struct('(auto)'`, `Struct('${typeName}'`);
        content = replaceAll(content, `Struct("(auto)"`, `Struct("${typeName}"`);

        content = replaceAll(content, `Mixin('(auto)'`, `Mixin('${typeName}'`);
        content = replaceAll(content, `Mixin("(auto)"`, `Mixin("${typeName}"`);

        content = replaceAll(content, `Enum('(auto)'`, `Enum('${typeName}'`);
        content = replaceAll(content, `Enum("(auto)"`, `Enum("${typeName}"`);

        content = replaceAll(content, `Interface('(auto)'`, `Interface('${typeName}'`);
        content = replaceAll(content, `Interface("(auto)"`, `Interface("${typeName}"`);

        // process file injections
        content = processInjections(basepath, content);

        // append content to file
        appendToFile(asm, content);

        // log
        console.log('   type: ' + qualifiedName + ' (' + file + ')'); // eslint-disable-line no-console
    };

    // append self registration
    const appendSelfRegistration = (ado, asm) => {
            let dump = `;flair.Assembly.register("${JSON.stringify(ado)}");`;
            appendToFile(asm, dump);
    };

    // append main file
    const appendMain = (asm, file, basepath) => { // eslint-disable-line no-unused-vars
        // pick file, if exists
        if (fsx.existsSync(file)) {
            // read content
            let content = fsx.readFileSync(file, 'utf8');

            // process file injections
            content = processInjections(basepath, content);

            // append content
            appendToFile(asm, content);

            // log
            console.log('   index: (' + file + ')'); // eslint-disable-line no-console
        } else {
            // log
            console.log('   index: (not found)'); // eslint-disable-line no-console
        }
    };

    // process injections
    const processInjections = (basepath, content) => {
        return injector(basepath, content);
    };

     // run lint
    const runLint = (asm) => {
        let lintReport = eslint.executeOnFiles([asm]);
        if (lintReport.errorCount > 0 || lintReport.warningCount > 0) {
            console.log(eslintFormatter(lintReport.results)); // eslint-disable-line no-console
            if (lintReport.errorCount > 0) {
                throw `${lintReport.errorCount} Linting errors found.`;
            }
        }
    };

    // minify code
    const minifyFile = (asm_min) => {
        let result = uglifyjs.minify([asm], uglifyConfig);
        if (result.error) {
            throw `Error minifying ${asm}. \n\n ${result.error}`;
        }
        fsx.writeFileSync(asm_min, result.code);
    };

    // create preamble
    const createPreamble = (adosJSON, preamble) => {
        fsx.writeFileSync(preamble, JSON.stringify(adosJSON));
    };


    // process group folder
    const process = (src, dest) => {
        // ados.json for this root
        let adosJSON =  [],
            preamble = path.join(dest, 'preamble.js');

        // get all assemblies under this group folder
        let folders = getFolders(src, true);

        // process each assembly folder
        for(let asmName of folders) {
            if (asmName.startsWith('_')) { continue; } // skip

            // log
            console.log('\nasm: ' + asmName); // eslint-disable-line no-console

            // assembly file at dest
            // NOTE: name of the folder is the name of the assembly itself
            let asm = path.join(dest, asmName + '.js');
            fsx.ensureFileSync(asm);
            
            // add assembly header
            appendHeader(asm, asmName);

            // append ado object
            let ado = appendADO(adosJSON, asm, asmName);

            // get all namespaces under this assembly folder
            let nsfolders = getFolders(path.join(src, asmName), true);
            
            // process each assembly folder
            for(let nsName of nsfolders) {
                if (nsName.startsWith('_')) { continue; } // skip
                
                // process types and resources under this namespace
                let ext = '',
                    typeName = '',
                    basepath = path.join(src, asmName, nsName),
                    files = rrd(basepath),
                    qualifiedName = '';
                for(let file of files) { 
                    ext = path.extname(file).toLowerCase();
                    if (file.indexOf('/_') !== -1) { continue; } // either a folder or file name starts with '_'. skip it

                    if (file.endsWith('.spec.js')) { // spec
                        continue; // ignore
                    } else if (file.endsWith('.res.js')) { // js as a resource
                        typeName = path.basename(file).replace('.res.js', '');
                        if (typeName.indexOf('.') !== -1) { throw `Resource name cannot contain dots. (${typeName})`; }
                        qualifiedName = nsName + '.' + typeName;
                        appendResource(ado, asm, file, qualifiedName);
                    } else if (file.endsWith('.js')) { // type
                        typeName = path.basename(file).replace('.js', '');
                        if (typeName.indexOf('.') !== -1) { throw `Type name cannot contain dots. (${typeName})`;}
                        qualifiedName = nsName + '.' + typeName;
                        appendType(ado, asm, file, basepath, nsName, typeName, qualifiedName);
                    } else if (file.endsWith('.res' + ext)) { // resource
                        typeName = path.basename(file).replace('.res' + ext, '');
                        if (typeName.indexOf('.') !== -1) { throw `Resource name cannot contain dots. (${typeName})`; }
                        qualifiedName = nsName + '.' + typeName;
                        appendResource(ado, asm, file, qualifiedName);
                    } else { // unknown 
                        continue; // ignore
                    }
                }
            }

            // copy assets of assemble
            let assets_folder = path.join(src, asmName, '_assets'),
                assets_folder_dest = path.join(dest, asmName);
            copyAssets(ado, assets_folder, assets_folder_dest);

            // append settings to ADO
            let asm_setting = path.join(src, asmName, 'settings.json');
            appendSettings(ado, asm_setting);

            // append assembly self-registration 
            appendSelfRegistration(ado, asm)

            // append asm initializer
            let asm_main = path.join(src, asmName, 'index.js'),
                basepath = path.join(src, asmName);
            appendMain(asm, asm_main, basepath);

            // lint
            runLint(asm);

            // minify
            let asm_min = asm.replace('.js', '.min.js');
            minifyFile(asm, asm_min);

            // done, print stats
            let stat = fsx.statSync(asm),
                stat_min = fsx.statSync(asm_min)
            console.log('==> ' + path.basename(asm) + ' (' + Math.round(stat.size / 1024) + 'kb, ' + Math.round(stat_min.size / 1024) + 'kb minified)\n'); // eslint-disable-line no-console
        }

        // write preamble file for the group folder
        createPreamble(adosJSON, preamble);
    };

    // delete all dest files
    delAll(destRoot);

    // process each group folder
    let _src, _dest = '';
    for(let item of srcList) {
        _src = item;
        
        // ignore if starts with '_'
        if (_src.startsWith('_')) { continue; }

        // process this group folder
        _dest = item.replace(srcRoot, destRoot);
        process(_src, _dest);
    }

    // done
    if (typeof done === 'function') {
        done();
    }
};


/**
 * @name build
 * @description Builds flair assemblies as per given configuration
 * @example
 *  build(options, cb)
 * @params
 *  options: object - build configuration object having following options:
 *              src: source folder root path
 *              dest: destination folder root path - where to copy built assemblies
 *              processAsGroups: how to interpret src folder
 *                  true - all root level folders under 'src' will be treated as one individual assembly
 *                  false - all root level folders under 'src' will be treated as individual groups and next level folders 
 *                          under each of these groups will be treated as one individual assembly
 *                          In this case, dest will have same folder groups created and group specific assemblies will be placed
 *                          under each group
 *                  Note: In both cases, if folder name starts with '_', it is skipped
 *              uglifyConfig: path of uglify config JSON file as in: https://github.com/mishoo/UglifyJS2#minify-options
 *              eslintConfig: path of eslint config JSON file, having structure as in: https://eslint.org/docs/user-guide/configuring
 *              depsConfig: path of dependencies update config JSON file, having structure as:
 *                  {
 *                      update: true/false - if run dependency update
 *                      deps: [] - each item in here should have structure as: { src, dest }
 *                                  NOTE:
 *                                      src: can be a web url or a local file path
 *                                      dest: local file path
 *                  }
 *                  NOTE: Having update set to true, before the start of assembly building, all local copies of external dependencies 
 *                        will be refreshed as per src/dest settings here.
 *              packageJSON: path of packageJSON file of the project
 *                  it picks project name, version and copyright information etc. from here to place on assembly
 *              utf8EncResFileTypes: an array of file extensions with a "."  to define for which extensions utf8 encoding needs to be 
 *                  done when bundling them inside assembly as resource
 *                  NOTE: define this only when you want to add to inbuilt defaults which are: 
 *                        ['.txt', '.xml', '.js', '.md', '.json', '.css', '.html', '.svg'];
 *                  no encoding is done for other resource types
 *              cb: callback function, if not being passed separately                   
 * 
 *              NOTE: All local paths must be related to root of the project
 * 
 * 
 *              NOTE: How assembly folder looks like?
 *                    All types and resources must exists in namespaces, so conflict across assemblies is avoided
 *                    Each assembly level folder can have following structure underneath
 *                    <assembly folder>
 *                          index.js            - assembly initializer file
 *                              > assembly's header is added first
 *                              > assembly's self-registration code is added next
 *                                  > assembly's name is taken to be <assembly folder> name itself
 *                              > all assembly contents of all namespaces are added next
 *                              > content of this file is bundled at the last
 *                                  > this file may have some initialization code and treated as assembly load event handler
 *                              > when these assemblies are loaded, following happens:
 *                                  > assembly gets registered with flair, if not already registered via "preamble"
 *                                    (flair is always global, on server and on client)
 *                                  > if "flair" object is not available as global, it throws error
 *                          settings.json       - assembly's settings file, get embedded in assembly definition file
 *                          <namespace folder>  - any other namespace folder is processed next
 *                              > this means, all folder under <assembly folder> are treated as namespace folders
 *                                with certain exclusions as:
 *                                > any folder name that starts with '_' is not processed
 *                              > namespaces even when nested, should exists at this level only
 *                                e.g., following are all valid namespace names
 *                                com.flair
 *                                com.flair.serialization
 *                                com.flair.aop
 *                              > unlike other systems, where the same would have been done like: (DON't DO FOLLOWING)
 *                                com
 *                                  flair
 *                                      aop
 *                                      serialization
 *                              > the reason former approach is chosen, is because it shows up all namespaces neatly under
 *                                <assembly folder>
 *                          (root)              - root namespace folder, is a special folder, that contains special members
 *                                                which are placed on root only. Should be avoided, as this is for flair's own
 *                                                system types
 *                          _assets    - assets folder
 *                                  > this special folder can be used to place all external assets like images, css, js, third-party
 *                                    libraries, fonts, etc.
 *                                  > it can have any structure underneath
 *                                  > all files and folder under it, are copied to destination under <assemnly folder> folder
 *                                  > which means, if an assembly has assets, in destination folder, it will look like:
 *                                      <assembly folder>.js        - the assembly file
 *                                      <assembly folder>.min.js    - the assembly file (minified)
 *                                      <assembly folder>/          - the assembly's assets folder content here under (this is created only if assets are defined)
 *                                  > note, '_assets' folder itself is not copied, but all contents underneath are copied
 * 
 *                          UNDER EACH NAMESPACED FOLDER:
 *                              Each namespace folder can take any structure and files can be placed in any which way
 *                              following types of files are processed as per associated rules:
 *                              _*              - any file name that starts with '_' is skipped
 *                              <_*>            - any folder name that starts with '_' is skipped all together
 *                              *.js            - assumed to be flair types, following are rules associated with this
 *                                  > it will be looked for "<!-- inject: relative path here -->" pattern
 *                                    and defined js file will be injected in-place
 *                                  > it will be looked for "$$('ns', '(auto)');" OR '$$("ns", "(auto)");' patterns and
 *                                    current namespace (i.e., the namespace folder under which anywhere, this file is placed)
 *                                    will be replaced as: e.g., "$$('ns', '(auto)');" may become "$$('ns', 'com.flair.aop');"
 *                                  > it will look for following type name patterns as well:
 *                                    "Class('(auto)',", "Struct('(auto)',", "Mixin('(auto)',", "Enum('(auto)',", and "Interface('(auto)'," 
 *                                    'Class("(auto)",', 'Struct("(auto)",', 'Mixin("(auto)",', 'Enum("(auto)",', and 'Interface("(auto)",' 
 *                                    each of these, the '(auto)' or "(auto)" will be replaced with the actual file name of the file
 *                                  > for both namespace and type names, case-sensitive names will be used, as is, whatever is the naming
 *                                    of folder or file
 *                                  > if two files placed under different folder inside a namespace have same name, they will
 *                                    end up having same qualified name, so builder will throw for these cases
 *                                  > though flair supports writing multiple type definitions inside a single file, it will be
 *                                    a problem when '(auto)' of two types is resolved with same file name, so either do not 
 *                                    keep more than one type information in one file, or use '(auto)' only for one type and give fixed
 *                                    name to other type
 *                                  > each type will therefore can be accessed via flair.getType('<namespace>.<filename>') name
 *                                  > File name is now allowed to have any dots
 *                              *.res.[html|css|js|xml|txt|md|json|png|jpg|jpeg|gif|svg]  - resource files
 *                                  > all such files that starts with '.res.[*]' will be treated as resource and will be bundled
 *                                    as resource 
 *                                  > all resource files which are [txt|xml|js|md|json|css|html|svg] types (or any other types,
 *                                    as defined in utf8EncResFileTypes option setting) will be UTF8 encoded too
 *                                  > wether UTF8 encoded or not, resources are base64 encoded when they are added to assemblies
 *                                  > name of the resource file also takes the same namespace, under which folder it is placed
 *                                  > if two files placed under different folder inside a namespace have same name, they will
 *                                    end up having same qualified name, so builder will throw for these cases
 *                                  > if two different type of files (e.g., abc.res.css and abc.res.html) inside a namespace have same name, 
 *                                    they will end up having same qualified name, so builder will throw for these cases
 *                                  > each resource will therefore can be accessed via flair.getResource('<namespace>.<filename>') name
 *                                    Note: .res. will be removed from the file name
 *                                  > File name is now allowed to have any dots
 *                          NOTE: Any other file, that does not map to identified types above are skipped,    
 *                                therefore files like *.spec.js or *.mjs, all are skipped 
 *      
 *                  How assemblies are loaded?
 *                          Every assembly can be loaded like a normal module or javascript file.
 *                          If flair.js is not already loaded, it will throw an error or if loaded, it will register itself
 *                          with flair.
 *                          
 *                          At every root level a <root folder name>.preamble.js file is created that contains all meta
 *                          information about each assembly with assembly registration code.
 *                          
 *                          For seamless use of assemblies, instead of loading each assembly separately, only this preamble file
 *                          should be loaded. This ensures that when user needs a type, required assembly is automatically loaded
 *                          behind the scenes.
 * 
 *  cb: function - callback function
 * @returns type - flair type for the given object
 */ 
module.exports = function(options, cb) {
    // single param
    if (typeof options === 'function') {
        cb = options;
        options = {}
    }
    
    // build options
    options = options || {};
    options.rootPath = options.rootPath || process.cwd();
    options.src = options.src || path.join(options.rootPath, 'src');
    options.dest = options.dest || path.join(options.rootPath, 'dist');
    options.processAsGroups = options.processAsGroups || false; // if true, it will treat first level folders under src as groups and will process each folder as group, otherwise it will treat all folders under src as individual assemblies
    options.uglifyConfig = options.uglifyConfig || path.join(options.rootPath, 'build/config/.uglify.json');
    options.eslintConfig = options.eslintConfig || path.join(options.rootPath, 'build/config/.eslint.json');
    options.depsConfig = options.depsConfig || path.join(options.rootPath, 'build/config/.deps.json');
    options.packageJSON = options.packageJSON || path.join(options.rootPath, 'package.json');
    options.utf8EncResFileTypes = ['.txt', '.xml', '.js', '.md', '.json', '.css', '.html', '.svg'].concat(options.utf8EncResFileTypes || []);
    options.cb = options.cb || cb;

    // get files
    uglifyConfig = JSON.parse(fsx.readFileSync(options.uglifyConfig, 'utf8'));
    eslintConfig = JSON.parse(fsx.readFileSync(options.eslintConfig, 'utf8'));
    depsConfig = JSON.parse(fsx.readFileSync(options.depsConfig, 'utf8'));
    packageJSON = JSON.parse(fsx.readFileSync(options.packageJSON, 'utf8'));

    // get engines
    eslint = new CLIEngine(eslintConfig);
    eslintFormatter = eslint.getFormatter();

    // after copy process
    let afterCopy = () => {
        // build source list
        let srcList = [];
        if (options.processAsGroups) {
            srcList = getFolders(options.src, true);    // list of all group folders
        } else {
            srcList.push(options.src);  // this itself is a group folder
        }

        // build
        doTask(srcList, options.src, options.dest, options.utf8EncResFileTypes, cb);
    };

    // update dependencies in source folder, if configured
    if (depsConfig.update) {
        copyDeps(depsConfig.deps, afterCopy)
    } else {
        afterCopy();
    }
};