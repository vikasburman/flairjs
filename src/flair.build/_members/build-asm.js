/**
 * @name flair Build
 * @description Build engine
 */
const rrd = require('recursive-readdir-sync'); 
const copyDir = require('copy-dir');
const path = require('path');
const fsx = require('fs-extra');
const del = require('del');
const CLIEngine = new require('eslint').CLIEngine
const uglifyjs = require('uglify-js-harmony');

let uglifyConfig, 
    eslintConfig,
    depsConfig,
    packageJSON, 
    suppressLogging = false,
    eslint, 
    skipRegistrationsFor = [
        'flair',
        'flair.build'
    ],
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
    if (deps.length > 0) {
        logger(`      deps: ${deps.length}`);
    }
    const processNext = (items) => {
        if (items.length !== 0) {
            let item = items.shift(); // {src, dest}
            logger(`            - ${item.dest}\n`);
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
                            fsx.readFileSync(path.join(basepath, fileName), 'utf8').split(/\r?\n/)
                            .map((line, i) => {
                                return (i > 0) ? whitespace + line : line
                            }).join('\n');
        content = content.replace(match, function () { return injectContent })
    }
    
    return content;
};
const bump = (packageFile) => {
    // bump version
    let ver = packageJSON.version.split('.');
    ver[0] = parseInt(ver[0]);
    ver[1] = parseInt(ver[1]);
    ver[2] = parseInt(ver[2]);
    if (ver[2] >= 99999) {
        ver[2] = 0
        if (ver[1] >= 999) {
            ver[1] = 0
            ver[0] += 1
        } else {
            ver[1] += 1
        }
    } else {
        ver[2] += 1
    }
    let newVer = ver[0].toString() + '.' + ver[1].toString() + '.' + ver[2].toString();
    packageJSON.version = newVer;
    fsx.writeFileSync(packageFile, JSON.stringify(packageJSON, null, 4), 'utf8');
    return newVer;
};
const logger = (msg) => {
    if (suppressLogging) { return; }
    console.log(msg);   // eslint-disable-line no-console
};

// do
const doTask = (srcList, rootPath, srcRoot, destRoot, utf8EncResFileTypes, done) => {
    const appendToFile = (asm, text, isAppend = true) => {
        if (isAppend) {
            fsx.writeFileSync(asm, text, {flag: 'a'});
        } else {
            fsx.writeFileSync(asm, text);
        }
    };  
    const appendHeader = (asm, asmName) => {
        let header = 
        `/**\n`+
        ` * @preserve\n` +
        ` * ${packageJSON.title}\n` +
        ` * ${packageJSON.description}\n` +
        ` * \n` +
        ` * Assembly: ${asmName}\n` +
        ` *     File: ${asm.replace(destRoot, '.')}\n` +
        ` *  Version: ${packageJSON.version}\n` +
        ` *  ${new Date().toUTCString()}\n` +
        ` * \n` +
        ` * ${packageJSON.copyright}\n` +
        ` * Licensed under ${packageJSON.license}\n` +
        ` */\n`;
        appendToFile(asm, header);
    };
    const appendClosureHeader = (asm, settingsJson) => {
        let closureHeader = 
        `(() => {\n` + 
        `   const { $$, attr, Class, Struct, Enum, Interface, Mixin, Exception, Args } = flair; // eslint-disable-line no-unused-vars\n` +
        `   const { Aspects, Assembly, Resource, Namespace, Container, Reflector, Serializer } = flair;   // eslint-disable-line no-unused-vars\n` +
        `   const { getAttr, getAssembly, getResource, getTypeOf } = flair;                     // eslint-disable-line no-unused-vars\n` +
        `   const { getType, typeOf, as, is, isDerivedFrom, isInstanceOf, isComplies, isImplements, isMixed } = flair;  // eslint-disable-line no-unused-vars\n` +
        `   const { include, dispose, using, on, dispatch } = flair;                            // eslint-disable-line no-unused-vars\n` +
        `   const { noop, telemetry } = flair;                                                  // eslint-disable-line no-unused-vars\n` +
        `   const { isServer } = flair.options.env;                                             // eslint-disable-line no-unused-vars\n` +
        `\n`; 
        if (settingsJson) { // settings is a closure variable of each assembly separately
            closureHeader += 
        `   const settings = JSON.parse('${settingsJson}'); // eslint-disable-line no-unused-vars\n`;
        } else {
        `   const settings = {}; // eslint-disable-line no-unused-vars\n`;
        }
        appendToFile(asm, closureHeader);
    };
    const appendClosureFooter = (asm) => {
        let closureFooter = 
        `\n` + 
        `})();\n`;
        appendToFile(asm, closureFooter);
    };    
    const appendADO = (ados, asm, asmName) => { // eslint-disable-line no-unused-vars
        // skip for special cases:
        if (skipRegistrationsFor.indexOf(asmName) !== -1) { return; }

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
        let ADO = {
            name: asmName,
            file: asm.replace('.js', '{.min}.js').replace(destRoot, '.'),
            desc: packageJSON.description,
            version: packageJSON.version,
            copyright: packageJSON.copyright,
            license: packageJSON.license,
            types: [],
            resources: [],
            assets: []
        };
        ados.push(ADO);
        return ADO;
    };
    const appendToADO = (ado, asmName, prop, value) => {
        // skip for special cases:
        if (skipRegistrationsFor.indexOf(asmName) !== -1) { return; }

        if (['types', 'resources', 'assets'].indexOf(prop) !== -1) {
            // validate for duplicate
            if (ado[prop].indexOf(value) !== -1) { throw `Member is already added/associated with assembly. (${value})`; }

            ado[prop].push(value); 
        } else {
            ado[prop] = value; 
        }
    };
    const copyAssets = (ado, asmName, assets_src, assets_dest) => {
        if (!fsx.existsSync(assets_src)) { 
            return; 
        } else {
            logger(`    assets: ${assets_src.replace(srcRoot, '.')}`); // eslint-disable-line no-console
        }

        // ensure dest folder exists
        fsx.ensureDirSync(assets_dest);

        // copy all assets and add to assets list as well
        copyDir.sync(assets_src, assets_dest, function(stat, filepath, filename){
            if (stat === 'file') { 
                // add to ado
                appendToADO(ado, asmName, 'assets', './' + filename);
            
                // log
                logger('            - ./' + path.join(assets_dest.replace(destRoot, './') + '/' + filename)); // eslint-disable-line no-console
            }
            return true;
        }, function (err) { throw err; });
    };
    const readSettings = (asmName, file) => {
        if (fsx.existsSync(file)) {
            // log
            logger('  settings: ' + file.replace(srcRoot, '.')); // eslint-disable-line no-console

            // return for embedding in assembly itself
            return JSON.stringify(JSON.parse(fsx.readFileSync(file)));
        }
        return '';
    };
    const appendToResourceList = (reslist, ado, asmName, asm, file, qualifiedName) => {
        reslist.push({ado: ado, asmName: asmName, asm: asm, file: file, qualifiedName: qualifiedName});
    };
    const appendResource = (ado, asmName, asm, file, qualifiedName) => {
        let content = '',
            encodingType = '',
            ext = path.extname(file).toLowerCase();

        // add to ado
        appendToADO(ado, asmName, 'resources', qualifiedName);

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
        let dump = `flair.Resource.register("${qualifiedName}", "${encodingType}", "${file.replace(destRoot, '.')}", "${content}");\n`;
        appendToFile(asm, dump);

        // log
        logger('            - ' + qualifiedName + ' (' +  file.replace(srcRoot, '.') + ')'); // eslint-disable-line no-console
    };
    const appendResources = (reslist) => {
        if (reslist.length > 0) {
            logger(` resources: ${reslist.length}`); // eslint-disable-line no-console

            // append
            for(let item of reslist) {
                appendResource(item.ado, item.asmName, item.asm, item.file, item.qualifiedName);
            }
        }
    };
    const appendToTypeList = (typelist, ado, asmName, asm, file, basepath, nsName, typeName, qualifiedName) => {
        typelist.push({ado: ado, asmName: asmName, asm: asm, file: file, basepath: basepath, nsName: nsName, typeName: typeName, qualifiedName: qualifiedName});
    };
    const appendType = (ado, asmName, asm, file, basepath, nsName, typeName, qualifiedName) => {
        // add to ado
        appendToADO(ado, asmName, 'types', qualifiedName);

        // copy file content
        let content = fsx.readFileSync(file, 'utf8');

        // find and replace namespace name if set for auto
        content = replaceAll(content, `$$('ns', '(auto)');`, `$$$('ns', '${nsName}');`); // replace all is eating up one '$', soo added 3, 2 left after that issues
        content = replaceAll(content, `$$("ns", "(auto)");`, `$$$("ns", "${nsName}");`); // replace all is eating up one '$', soo added 3, 2 left after that issues

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
        logger('            - ' + qualifiedName + ' (' + file.replace(srcRoot, '.') + ')'); // eslint-disable-line no-console
    };
    const appendTypes = (typelist, asm, asmName, src) => {
        if (typelist.length > 0) {
            logger(`     types: ${typelist.length}`); // eslint-disable-line no-console

            // append closure header with settings
            let asm_setting = path.join(src, asmName, 'settings.json');
            appendClosureHeader(asm, readSettings(asmName, asm_setting));

            // append
            for(let item of typelist) {
                appendType(item.ado, item.asmName, item.asm, item.file, item.basepath, item.nsName, item.typeName, item.qualifiedName);
            }

            // append closure footer
            appendClosureFooter(asm);
        }
    };
    const appendSelfRegistration = (ado, asm, asmName) => {
        // skip for special cases:
        if (skipRegistrationsFor.indexOf(asmName) !== -1) { return; }

        logger('   selfreg: yes'); // eslint-disable-line no-console

        let dump = `flair.Assembly.register('${JSON.stringify(ado)}');\n`;
        appendToFile(asm, dump);
    };
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
            logger('     index: ' + file.replace(srcRoot, '.')); // eslint-disable-line no-console
        }
    };
    const processInjections = (basepath, content) => {
        return injector(basepath, content);
    };
    const runLint = (asm) => {
        let lintReport = eslint.executeOnFiles([asm]);
        if (lintReport.errorCount > 0 || lintReport.warningCount > 0) {
            logger(eslintFormatter(lintReport.results)); // eslint-disable-line no-console
            if (lintReport.errorCount > 0) {
                throw `${lintReport.errorCount} Linting errors found.`;
            }
        }
    };
    const minifyFile = (asm, asm_min) => {
        let result = uglifyjs.minify([asm], uglifyConfig);
        if (result.error) {
            throw `Error minifying ${asm}. \n\n ${result.error}`;
        }
        fsx.writeFileSync(asm_min, result.code);
    };
    const createPreamble = (adosJSON, preamble) => {
        if (adosJSON.length === 0) {
            return;
        } else {
            logger(`\n  preamble: ${preamble.replace(destRoot, '.')}`);  // eslint-disable-line no-console
            let ados = JSON.stringify(adosJSON);
            let dump = `(() => { let ados = JSON.parse('${ados}');flair.Assembly.register(ados);})();`;
            fsx.writeFileSync(preamble, dump);
        }
    };

    // process group folder
    const process = (src, dest) => {
        if (src.replace(srcRoot, '.') !== '.') { // groups are being processed
            logger(`\n     group: ${src.replace(srcRoot, '.')} (start)`);  // eslint-disable-line no-console
        }

        // ados.json for this root
        let adosJSON =  [],
            preamble = path.join(dest, 'preamble.js');

        // get all assemblies under this group folder
        let folders = getFolders(src, true);

        // process each assembly folder
        for(let asmName of folders) {
            if (asmName.startsWith('_')) { continue; } // skip

            // log
            logger('\n       asm: ' + asmName); // eslint-disable-line no-console

            // assembly file at dest
            // NOTE: name of the folder is the name of the assembly itself
            let asm = path.join(dest, asmName + '.js'),
                reslist = [],
                typelist = [];
            fsx.ensureFileSync(asm);
            
            // add assembly header
            appendHeader(asm, asmName);

            // append asm initializer
            let asm_main = path.join(src, asmName, 'index.js'),
                basepath = path.join(src, asmName);
            appendMain(asm, asm_main, basepath);

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
                        qualifiedName = (nsName !== '(root)' ? nsName + '.' : '') + typeName;
                        appendToResourceList(reslist, ado, asmName, asm, file, qualifiedName);
                    } else if (file.endsWith('.js')) { // type
                        typeName = path.basename(file).replace('.js', '');
                        if (typeName.indexOf('.') !== -1) { throw `Type name cannot contain dots. (${typeName})`;}
                        qualifiedName = (nsName !== '(root)' ? nsName + '.' : '')  + typeName;
                        appendToTypeList(typelist, ado, asmName, asm, file, basepath, nsName, typeName, qualifiedName);
                    } else if (file.endsWith('.res' + ext)) { // resource
                        typeName = path.basename(file).replace('.res' + ext, '');
                        if (typeName.indexOf('.') !== -1) { throw `Resource name cannot contain dots. (${typeName})`; }
                        qualifiedName = (nsName !== '(root)' ? nsName + '.' : '')  + typeName;
                        appendToResourceList(reslist, ado, asmName, asm, file, qualifiedName);
                    } else { // unknown 
                        continue; // ignore
                    }
                }
            }

            // copy assets of assemble
            let assets_folder = path.join(src, asmName, '_assets'),
                assets_folder_dest = path.join(dest, asmName);
            copyAssets(ado, asmName, assets_folder, assets_folder_dest);

            // append types
            appendTypes(typelist, asm, asmName, src);

            // append resources
            appendResources(reslist);

            // append assembly self-registration 
            appendSelfRegistration(ado, asm, asmName)

            // lint
            runLint(asm);

            // minify
            let asm_min = asm.replace('.js', '.min.js');
            minifyFile(asm, asm_min);

            // done, print stats
            let stat = fsx.statSync(asm),
                stat_min = fsx.statSync(asm_min)
            logger('       ==>: ' + asm.replace(destRoot, '.') + ' (' + Math.round(stat.size / 1024) + 'kb, ' + Math.round(stat_min.size / 1024) + 'kb minified)'); // eslint-disable-line no-console
        }

        // write preamble file for the group folder
        createPreamble(adosJSON, preamble);

        if (src.replace(srcRoot, '.') !== '.') { // groups are being processed
            logger(`\n     group: ${src.replace(srcRoot, '.')} (end)`);  // eslint-disable-line no-console
        }
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
 *              eslintConfig: path of eslint config JSON file, having structure as in: https://eslint.org/docs/user-guide/configuring AND https://eslint.org/docs/developer-guide/nodejs-api#cliengine
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
 *                          settings.json       - assembly's settings file, get embedded in assembly itself and is available as settings variable
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
 *                          At every root level a 'preamble.js' file is created that contains all meta
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
    options.suppressLogging = options.suppressLogging || false;
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
    suppressLogging = options.suppressLogging;

    // log for check
    logger('\nflairBuild: start\n');                                               // eslint-disable-line no-console
    logger(`   grouped: ${options.processAsGroups ? 'yes': 'no'}`);                // eslint-disable-line no-console
    logger(`      root: ${options.rootPath}`);                                     // eslint-disable-line no-console
    logger(`       src: ${options.src.replace(options.rootPath, '.')}`);           // eslint-disable-line no-console
    logger(`      dest: ${options.dest.replace(options.rootPath, '.')}`);          // eslint-disable-line no-console
    logger(`      deps: ${options.depsConfig.replace(options.rootPath, '.')}`);    // eslint-disable-line no-console
    logger(`    verify: ${options.eslintConfig.replace(options.rootPath, '.')}`);  // eslint-disable-line no-console
    logger(`    minify: ${options.uglifyConfig.replace(options.rootPath, '.')}\n`);  // eslint-disable-line no-console

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

        // bump version number
        let oldVer = packageJSON.version;
        let newVer = bump(options.packageJSON);
        logger(`   version: ${oldVer} -> ${newVer}`);    // eslint-disable-line no-console

        // build
        doTask(srcList, options.rootPath, options.src, options.dest, options.utf8EncResFileTypes, () => {
            logger('\nflairBuild: end\n'); // eslint-disable-line no-console
            if (typeof cb === 'function') {
                cb();
            }
        });
    };

    // update dependencies in source folder, if configured
    if (depsConfig.update) {
        copyDeps(depsConfig.deps, afterCopy)
    } else {
        afterCopy();
    }
};