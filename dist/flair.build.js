/**
 * @preserve
 * FlairJS - Assembly Builder
 * True Object Oriented JavaScript
 * Version 0.15.30
 * Mon, 18 Feb 2019 21:37:07 GMT
 * (c) 2017-2019 Vikas Burman
 * MIT
 * https://flairjs.com
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

// do
const doTask = (srcList, srcRoot, destRoot, utf8EncResFileTypes, done) => {
    // srcList is an array of source paths that need to be processed for assembly building
    // injections data
    let injections = [];

    // get guid
    const guid = () => { 
        return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });        
    };

    // find injection
    const findNextInjection = (content, root) => {
        let prefix = '//// flair.inject:',
            suffix = '////',
            injection = {
                found: false,
                file: '',
                from: -1,
                upto: -1,
                token: '',
                previous: '',
                next: ''
            };
        injection.from = content.indexOf(prefix);
        if (injection.from !== -1) {
            injection.upto = content.indexOf(suffix, injection.from + 4);
            if (injection.upto !== -1) {
                injection.found = true;
                injection.file = content.substr(injection.from, (injection.upto - injection.from)).replace(prefix, '').trim().replace('./', root + '/')
                injection.token = content.substr(injection.from, injection.upto + 4);
                injection.previous = content.substr(0, injection.from);
                injection.next = content.substr(injection.upto + 4);
            }
        }
        return injection;
    }

    // inject content
    const processInjections = (fle) => {
        let content = fsx.readFileSync(fle, 'utf8'),
            root = path.dirname(fle),
            injection = findNextInjection(content, root),
            minifiedFile = '',
            minifiedFileContent = '',
            fileContent = '',
            fileContentId = '';
        if (injection.found) {
            // eslint-disable-next-line no-constant-condition
            while(true) {
                if (fsx.existsSync(injection.file)) {
                    minifiedFile = injection.file;
                    minifiedFileContent = '';

                    // get minified file content, if available
                    if (path.extname(injection.file) === '.js') {
                        minifiedFile = injection.file.replace('.js', '.min.js');
                        if (fsx.existsSync(minifiedFile)) {
                            minifiedFileContent = fsx.readFileSync(minifiedFile, 'utf8');
                        } else {
                            minifiedFile = injection.file;
                        }
                    }

                    // log
                    console.log('    >> inject: ' + injection.file + ' (min: ' + (injection.file === minifiedFile ? 'missing, used same' : minifiedFile) + ')'); // eslint-disable-line no-console

                    // get file content
                    fileContent = fsx.readFileSync(injection.file, 'utf8');
                    minifiedFileContent = minifiedFileContent || fileContent;

                    // defer injection for later (so that injected content is not passed through linting and minify process)
                    fileContentId = "'" + guid() + "';";
                    injections.push({
                        id: fileContentId, 
                        content: fileContent, 
                        minifiedContent: minifiedFileContent});

                    // put injection placeholder    
                    fileContent = `\n // START: ${injection.file}\n${fileContentId}\n // END: ${injection.file}`;
                    content = injection.previous + fileContent + injection.next;
                } else {
                    throw `File ${injection.file} referred for injection is not found.`;
                }
        
                // find next injection
                injection = findNextInjection(content, root);
                if (!injection.found) { break; }
            }
        }
        return content;
    };

    // bundle injections
    const bundleInjections = (asm, asm_min) => {
        const findAndReplace = (content, id, replaceWith) => {
            if (content.indexOf(id) === -1) { // single quote must now be converted into double quote
                id = '"' + id.substr(1, id.length - 3) + '";';
            }
            let previous = content.substr(0, content.indexOf(id)),
                next = content.substr(content.indexOf(id) + id.length);
            return previous + replaceWith + next;
        };

        let asmContent = fsx.readFileSync(asm, 'utf8'),
            asm_minContent = fsx.readFileSync(asm_min, 'utf8');
        for (let injection of injections) {
            asmContent = findAndReplace(asmContent, injection.id, injection.content);
            asm_minContent = findAndReplace(asm_minContent, injection.id, injection.minifiedContent);
        }
        fsx.writeFileSync(asm, asmContent, 'utf8');
        fsx.writeFileSync(asm_min, asm_minContent, 'utf8');
    };

    // append file
    const appendFile = (asm, file, realFile) => {
        fsx.writeFileSync(asm, `\n // START: ${realFile || file}`, {flag: 'a'});
        fsx.writeFileSync(asm, fsx.readFileSync(file, 'utf8'), {flag: 'a'});
        fsx.writeFileSync(asm, `\n // END: ${realFile || file}`, {flag: 'a'});
    };

    // append text to file
    const appendToFile = (asm, text, isAppend = true) => {
        if (isAppend) {
            fsx.writeFileSync(asm, text, {flag: 'a'});
        } else {
            fsx.writeFileSync(asm, text);
        }
    };

    // append type to ADO
    const appendTypeToADO = (ado, type) => {
        if (ado.types.indexOf(type) !== -1) {
            throw `Type ${type} is already registered.`;
        }
        ado.types.push(type);
    };

    // append asset to ADO
    const appendAssetToADO = (ado, astFile) => {
        ado.assets.push(astFile);
    };

     // append settings to ADO
    const appendSettingsToADO = (ado, settings) => {
        ado.settings = settings;
    }

     // run lint
    const runLint = (jsFile) => {
        let lintReport = eslint.executeOnFiles([jsFile]);
        if (lintReport.errorCount > 0 || lintReport.warningCount > 0) {
            console.log(eslintFormatter(lintReport.results)); // eslint-disable-line no-console
            if (lintReport.errorCount > 0) {
                throw `${lintReport.errorCount} Linting errors found.`;
            }
        }
    };

    // minify code
    const minifyFile = (jsFile) => {
        let result = uglifyjs.minify([jsFile], uglifyConfig);
        if (result.error) {
            throw `Error minifying ${jsFile}. \n\n ${result.error}`;
        }
        return result.code;
    };

    // lint, minify, append
    const lintMinifyAppend = (asm, asm_min, fle, content) => {
        // save to a temp file
        let _tempFile = './build/__temp__.js';
        fsx.writeFileSync(_tempFile, content);

        // run lint on this
        runLint(_tempFile);

        // append file
        appendFile(asm, _tempFile, fle);
        appendToFile(asm_min, minifyFile(_tempFile));

        // delete temp file
        fsx.unlinkSync(_tempFile);
    };

   // append resource
    const appendResource = (ado, asm, asm_min, resFile) => {
        // each resource name is the qualified name of the resource following by .res.<ext>
        // so for example, a resource flair.abc.res.json can be placed anywhere
        // and it will be accessible as a normal type via getResource(name) calls
        let ext = path.extname(resFile).toLowerCase(),
            resName = '',
            content = '',
            encodingType = '',
            resLocale = ''; // for now it is empty - means undefined // TODO: sometime later consider passing locale of the resource
        resName = path.basename(resFile);
        resName = resName.substr(0, resName.indexOf('.res'));

        // read file
        if (utf8EncResFileTypes.indexOf(ext) === -1) { // utf8 encoding resFileTypes must contain extension names with a .
            content = fsx.readFileSync(resFile, 'utf8');
            encodingType = 'utf8;';
        } else { // no encoding
            content = fsx.readFileSync(resFile);
            encodingType = '';
        }
        content = new Buffer(content).toString('base64');
        encodingType += 'base64;';

        // add to minified
        let dump = `;flair.Resource.register("${resName}", "${resLocale}", "${encodingType}", "${resFile}", "${content}");`;
        appendToFile(asm_min, dump);

        // add to standard
        dump = `\n // START: ${resFile}\n${dump}\n // END: ${resFile}`;
        appendToFile(asm, dump);

        // log
        console.log('    res: ' + resName + ' (' +  resFile + ')'); // eslint-disable-line no-console

        // register with ado
        appendTypeToADO(ado, resName);
    };

    // copy assets
    const copyAsset = (ado, asm, asm_min, astFile, src, dest) => {
        let destFile = astFile.replace(src, dest).replace('.ast', ''),
            destFld = path.dirname(destFile);

        // ensure dest folder exists
        fsx.ensureDirSync(destFld);

        // copy asset file to dest folder as is
        fsx.copyFileSync(astFile, destFile);

        // append asset to ado
        appendAssetToADO(ado, destFile.replace(dest, '.'));

        // log
        console.log('  asset: ' + path.basename(astFile) + ' -> ' + path.basename(destFile) + ' (' + path.dirname(astFile) + ' -> ' + path.dirname(destFile) + ')'); // eslint-disable-line no-console
    };

    // append type
    const appendType = (ado, asm, asm_min, typeFile) => {
        // each type name is the qualified name of the type following by .js
        // so for example, a type flair.App.js can be placed anywhere
        // and it will be accessible as flair.App type via bring or other means
        let typeName = path.basename(typeFile, '.js');

        // log
        console.log('   type: ' + typeName + ' (' + typeFile + ')'); // eslint-disable-line no-console

        // process injections
        let content = processInjections(typeFile);

        // LintMinifyAppend
        lintMinifyAppend(asm, asm_min, typeFile, content);

        // register in ADO
        appendTypeToADO(ado, typeName);                  
    };

    // append files
    const appendFiles = (ado, asm, asm_min, fld, mainFile, steFile, src, dest) => {
        let files = rrd(fld),
            ext = '',
            theFile = '';
        for(let file of files) { 
            ext = path.extname(file).toLowerCase();
            theFile = './' + file;
            if (theFile.indexOf('/_') !== -1) { continue; }
            if (theFile === mainFile) { continue; }
            if (theFile === steFile) { continue; }
            if (ext === '.js') {
                if (file.endsWith('.spec.js')) { // spec
                    console.log('   spec: Skipped! (' + theFile + ')'); // eslint-disable-line no-console
                } else if (file.endsWith('.res.js')) { // resource
                    appendResource(ado, asm, asm_min, theFile);
                } else if (file.endsWith('.ast.js')) { // asset
                    copyAsset(ado, asm, asm_min, theFile, src, dest);
                } else { // type
                    appendType(ado, asm, asm_min, theFile);
                }
            } else {
                if (file.endsWith('.ast' + ext)) { // known asset type
                    copyAsset(ado, asm, asm_min, theFile, src, dest);
                } else if (file.endsWith('.res' + ext)) { // known resource type
                    appendResource(ado, asm, asm_min, theFile);
                } else { // unknown scheme of things
                    throw `Unknown file scheme ${theFile}.`;
                }
            }
        }
    };

    // append main file
    const appendMain = (asm, asm_min, fle, src) => { // eslint-disable-line no-unused-vars
        // pick fle, if exists
        if (fsx.existsSync(fle)) {
            // log
            console.log('   main: ' + path.basename(fle) + ' (' + fle + ')'); // eslint-disable-line no-console

            // process injections
            let content = processInjections(fle);

            // LintMinifyAppend
            lintMinifyAppend(asm, asm_min, fle, content);
        } else {
            // log
            console.log('   main: (not found)'); // eslint-disable-line no-console
        }
    };

    const appendSettings = (ado, asm, asm_min, steFile) => {
        if (fsx.existsSync(steFile)) {
            // log
            console.log(' config: ' + steFile); // eslint-disable-line no-console

            // register with ado
            appendSettingsToADO(ado, JSON.parse(fsx.readFileSync(steFile)));
        } else {
            // log
            console.log(' config: (not found)'); // eslint-disable-line no-console
        }
    };

    // append ADO
    const appendADO = (ados, asm, asm_min, asmName, dest) => { // eslint-disable-line no-unused-vars
        // each ADO object has:
        //      "name": "", 
        //      "file": "",
        //      "desc": "",
        //      "version": "",
        //      "copyright": "",
        //      "license": "",
        //      "types": ["", "", ...],
        //      "assets": ["", "", ...],
        //      "settings: {}"
        let ADO = {
            name: asmName,
            file: asm_min.replace('.min.js', '{.min}.js'),
            desc: packageJSON.description,
            version: packageJSON.version,
            copyright: packageJSON.copyright,
            license: packageJSON.license,
            types: [],
            assets: [],
            settings: {}
        };
        ados.push(ADO);
        return ADO;
    };

    // append assembly header
    const appendHeader = (asmName, asm, asm_min, dest) => {
        let filePath = asm.replace(dest, '.');
        let header = 
        `/**\n`+
        ` * ${packageJSON.title}\n` +
        ` * ${packageJSON.description}\n` +
        ` * \n` +
        ` * Assembly: ${asmName}\n` +
        ` *     File: [[file_path]]\n` +
        ` *  Version: ${packageJSON.version}\n` +
        ` *  ${new Date().toUTCString()}\n` +
        ` * \n` +
        ` * ${packageJSON.copyright}\n` +
        ` * ${packageJSON.license}\n` +
        ` */\n`;
        appendToFile(asm, header.replace('[[file_path]]', filePath));

        // minified
        filePath = asm_min.replace(dest, '.');
        appendToFile(asm_min, header.replace('[[file_path]]', filePath));
    };

    // process folder
    const process = (src, dest) => {
        // initialize injections
        injections = [];

        // ados.json for this root
        let adosJSON =  [];

        // get all assemblies under this root
        let folders = getFolders(src, true);

        // process each assembly
        for(let asmName of folders) {
            // log
            console.log('\nasm: ' + asmName); // eslint-disable-line no-console

            // assembly file at dest
            // NOTE: name of the folder is the name of the assembly itself
            // and should generally be matched to the namespace being used for types and 
            // resources inside assembly
            let asm = dest + '/' + asmName + '.js',
                asm_min = dest + '/' + asmName + '.min.js';
            fsx.ensureFileSync(asm);
            fsx.ensureFileSync(asm_min);
            
            // asm header
            appendHeader(asmName, asm, asm_min, dest);

            // append ado object
            let ado = appendADO(adosJSON, asm, asm_min, asmName, dest);

            // append asm initializer
            let mainFile = src + '/' + asmName + '/index.js',
                steFile = src + '/' + asmName + '/settings.json';
            appendMain(asm, asm_min, mainFile, src + '/' + asmName);

            // append all files, folders having types, resources and assets
            // each assembly can have any structure underneath its main folder
            // all folders/files that starts with '_' are skipped processing
            // all *.spec.js files are skipped
            // all *.res.html|css|js|xml|txt|md|json|png|jpg|jpeg|gif files are added as resource in assembly
            //  note: resource name is the file name minus ".res.<ext>". e.g., flair.mainCSS.res.css will be available as flair.mainCSS resource
            // all *.ast.* files are treated as assets and copied in same folder structure to assembly name folder at dest
            //  note: while copying, the ".ast" is removed, so file name becomes natural file name
            // all *.js are treated as types and bundled
            // all *.js files are looked for "//// flair.inject: <relative file name> ////" patters and defined file is injected in-place
            // the index.js file at root folder is treated as assembly initializer and processed first
            // the settings.json file at root folder is treated as assembly settings and added to ADO as default settings for assembly
            // all files other than above scheme of file names, are ignored and remain untouched and a warning is shown
            appendFiles(ado, asm, asm_min, src + '/' + asmName, mainFile, steFile, src, dest);

            // append settings
            appendSettings(ado, asm, asm_min, steFile);

            // now bundle all injections
            bundleInjections(asm, asm_min);
            injections = [];

            // done, print stats
            let stat = fsx.statSync(asm),
                stat_min = fsx.statSync(asm_min)
            console.log('==> ' + path.basename(asm) + ' (' + Math.round(stat.size / 1024) + 'kb, ' + Math.round(stat_min.size / 1024) + 'kb minified)\n'); // eslint-disable-line no-console
        }

        // write ados.json for this root
        fsx.writeFileSync(dest + '/ados.json', JSON.stringify(adosJSON));
    };

    // delete all dest files
    delAll(destRoot);

    // process each source folder
    let _src, _dest = '';
    for(let item of srcList) {
        _src = item;
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
 *                  false - all root level folders under 'src' will be treated as individual groups and next level folders under each of these groups will be treated as one individual assembly
 *                  NOTE: each assembly level folder can have any structure underneath, following rules apply when building assemblies
 *                      > append all files, folders having types, resources and assets
 *                      > each assembly can have any structure underneath its main folder
 *                      > all folders/files that starts with '_' are skipped processing
 *                      > all *.spec.js files are skipped
 *                      > all *.res.html|css|js|xml|txt|md|json|png|jpg|jpeg|gif files are added as resource in assembly
 *                        NOTE: resource name is the file name minus ".res.<ext>". e.g., a.b.c.mainCSS.res.css will be available as a.b.c.mainCSS resource
 *                        This means, each resource name is the qualified name of the resource following by .res.<ext>
 *                      > all *.ast.* files are treated as assets and copied in same folder structure to assembly name folder at dest
 *                        NOTE: while copying, the ".ast" is removed, so file name becomes natural file name
 *                      > all *.js are treated as types and bundled
 *                        each type name is the qualified name of the type following by .js, e.g. a.b.c.MyClass.js -- and it should also have same type defined in there with 'a.b.c.MyClass'
 *                        CAUTION: If these are different, type will be registered by the name defined inside, but will not be resolved via load/bring or other means
 *                        As of now, assembly builder does not warn or change about this. TODO: this is to be implemented
 *                        NOTE: all *.js files are looked for "//// flair.inject: <relative file name> ////" patters and defined file is injected in-place
 *                      > the index.js file at root folder is treated as assembly initializer and added first
 *                      > the settings.json file at root folder is treated as assembly settings and added to ADO as default settings for assembly
 *                      >  all files other than above scheme of file names, are ignored and remain untouched and a warning is shown
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
 *              packageJSON: path of packageJSON file
 *              utf8EncResFileTypes: an array of file extensions with a "."  to define for which extensions urf8 encoding needs to be done when bundling them inside assembly
 *                  NOTE: define this only when you want to change, inbuilt defaults are: ['.txt', '.xml', '.js', '.md', '.json', '.css', '.html', '.svg'];
 *                  no encoding is done for other resource types
 *              cb: callback function, if not being passed separately
 * 
 *              NOTE: All local paths must be related to root of the project
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
    options.src = options.src || './src';
    options.dest = options.dest || './dist';
    options.processAsGroups = options.processAsGroups || false; // if true, it will treat first level folders under src as groups and will process each folder as group, otherwise it will treat all folders under src as individual assemblies
    options.uglifyConfig = options.uglifyConfig || './build/config/.uglify.json';
    options.eslintConfig = options.eslintConfig || './build/config/.eslint.json';
    options.depsConfig = options.depsConfig || './build/config/.deps.json';
    options.packageJSON = options.packageJSON || './package.json';
    options.utf8EncResFileTypes = options.utf8EncResFileTypes || ['.txt', '.xml', '.js', '.md', '.json', '.css', '.html', '.svg'];
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
            srcList = getFolders(options.src, true);
        } else {
            srcList.push(options.src);
        }

        // build
        doTask(srcList, options.src, options.dest, cb);
    };

    // update dependencies in source folder, if configured
    if (depsConfig.update) {
        copyDeps(depsConfig.deps, afterCopy)
    } else {
        afterCopy();
    }
};