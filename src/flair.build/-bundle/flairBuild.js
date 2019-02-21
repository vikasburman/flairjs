/**
 * @name flair Build
 * @description Build engine
 */
const rrd = require('recursive-readdir-sync'); 
const copyDir = require('copy-dir');
const path = require('path');
const fsx = require('fs-extra');
const del = require('del');

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
const escapeRegExp = (string) => {
    return string.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, '\\$1'); // eslint-disable-line no-useless-escape
};
const replaceAll = (string, find, replace) => {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

const bump = (options) => {
    if (options.skipBumpVersion) { return; }

    // bump version
    let ver = options.packageJSON.version.split('.');
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
    options.packageJSON.version = newVer;
    fsx.writeFileSync(options.package, JSON.stringify(options.packageJSON, null, 4), 'utf8');
    
    options.logger(0, 'version', newVer);
};
const copyDeps = (isPost, options, done) => {
    let deps = [];
    if (isPost) {
        if (options.postBuildDeps && options.depsConfig && options.depsConfig.post.length > 0) { 
            deps = options.depsConfig.post.slice();
        }
    } else {
        if (options.preBuildDeps && options.depsConfig && options.depsConfig.pre.length > 0) {
            deps = options.depsConfig.pre.slice();
        }
    }
    if (deps.length === 0) { done(); return; }
    options.logger(0, 'deps',  (isPost ? '(post)' : '(pre)'), true);

    const processNext = (items) => {
        if (items.length !== 0) {
            let item = items.shift(); // {src, dest}
            options.logger(1, '', item.dest);
            if (!isPost && item.src.startsWith('http')) { // http is supported only in case of pre deps
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
                        let dest = path.resolve(item.dest);
                        fsx.ensureFileSync(dest);
                        fsx.writeFileSync(dest, body, 'utf8');
                        processNext(items);
                    });
                }).on('error', (e) => {
                    throw `Failed to fetch dependency: ${item.src}. \n\n ${e}`;
                });
            } else { // local file / folder path
                let src = path.resolve(item.src),
                    dest = path.resolve(item.dest);
                if (fsx.lstatSync(src).isDirectory()) {
                    copyDir.sync(src, dest);
                } else {
                    fsx.copyFileSync(src, dest);
                }
                processNext(items);
            }
        } else {
            done();
        }
    };

    processNext(deps);
};
const injector = (base, content) => {
    // Unescaped \s*([\(\)\w@_\-.\\\/]+)\s*
    const FILENAME_PATTERN = '\\s*([\\(\\)\\w@_\\-.\\\\/]+)\\s*';
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
                            fsx.readFileSync(path.join(base, fileName), 'utf8').split(/\r?\n/)
                            .map((line, i) => {
                                return (i > 0) ? whitespace + line : line
                            }).join('\n');
        content = content.replace(match, function () { return injectContent })
    }
    
    return content;
};
const build = (options, done) => {
    const logger = options.logger;
    const appendToFile = (text, isAppend = true) => {
        if (isAppend) {
            fsx.writeFileSync(options.current.asm, text, {flag: 'a'});
        } else {
            fsx.writeFileSync(options.current.asm, text);
        }
    };     
    const appendHeader = () => {
        let header = 
        `/**\n`+
        ` * @preserve\n` +
        ` * ${options.packageJSON.title}\n` +
        ` * ${options.packageJSON.description}\n` +
        ` * \n` +
        ` * Assembly: ${options.current.asmName}\n` +
        ` *     File: ${options.current.asm.replace(options.current.dest, '.')}\n` +
        ` *  Version: ${options.packageJSON.version}\n` +
        ` *  ${new Date().toUTCString()}\n` +
        ` * \n` +
        ` * ${options.packageJSON.copyright}\n` +
        ` * Licensed under ${options.packageJSON.license}\n` +
        ` */\n`;
        appendToFile(header);
    };
    const appendMain = () => {
        if (fsx.existsSync(options.current.asmMain)) {
            let content = fsx.readFileSync(options.current.asmMain, 'utf8');
            content = injector(options.current.asmPath, content);
            appendToFile(content); 
            logger(0, 'index', options.current.asmMain); 
        }
    };
    const appendADO = () => {
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
        options.current.ado = {
            name: options.current.asmName,
            file: options.current.asm.replace(options.current.dest, '.'),
            desc: options.packageJSON.description,
            version: options.packageJSON.version,
            copyright: options.packageJSON.copyright,
            license: options.packageJSON.license,
            types: [],
            resources: [],
            assets: []
        };

        if (options.skipRegistrationsFor.indexOf(options.current.asmName) === -1) { // if not to be skipped for preamble
            options.current.adosJSON.push(options.current.ado);
        }
    };
    const lintJS = (file) => {
        // TODO
    };
    const lintCSS = (file) => {
        // TODO
    };
    const lintHTML = (file) => {
        // TODO
    };
    const minifyJS = (content) => {
        // TODO
        return content;
    };
    const minifyCSS = (content) => {
        // TODO
        return content;
    };
    const minifyHTML = (content) => {
        // TODO
        return content;
    };
    const lintFile = (src) => {
        let ext = path.extname(src).substr(1);
        if (options.lintTypes.indexOf(ext) !== -1) {
            switch(ext) {
                case 'js': content = lintJS(src); break;
                case 'css': content = lintCSS(src); break;
                case 'html': content = lintHTML(src); break;
            }
        }
    };
    const minifyFile = (src) => {
        let content = fsx.readFileSync(src, 'utf8'),
            ext = path.extname(src).substr(1),
            dest = src.replace('.' + ext, '.min.' + ext);
        if (options.minifyTypes.indexOf(ext) !== -1) {
            let minified = false;
            switch(ext) {
                case 'js': content = minifyJS(content); minified = true; break;
                case 'css': content = minifyCSS(content); minified = true; break;
                case 'html': content = minifyHTML(content); minified = true; break;
            }
            if (minified) {
                fsx.writeFileSync(dest, content, 'utf8');
            }
        }
    };
    const gzipFile = (src) => {
        let content = fsx.readFileSync(src, 'utf8'),
            ext = path.extname(src).substr(1),
            dest = src + '.gz';
        if (options.gzipTypes.indexOf(ext) !== -1) {
            gzConfig = options.gzipConfig[ext] || options.gzipConfig.all; // pick ext specific configuration or generic (all)
            fsx.writeFileSync(dest, options.zlib.gzipSync(content, gzConfig));
        }
    };
    const processAssets = () => {
        if (options.current.ado.assets.length === 0) { return; }

        logger(0, 'assets', options.current.ado.assets.length);

        // process assets
        let justNames = [];
        for(let astFile of options.current.ado.assets) {
            justNames.push(astFile.dest);

            fsx.ensureDirSync(path.dirname(astFile.dest)); // ensure dest folder exists
            fsx.copyFileSync(astFile.src, astFile.dest);
            astFile.stat = astFile.dest.replace(options.current.dest, '.') + 
            ' (' + Math.round(fsx.statSync(astFile.dest).size / 1024) + 'kb';

            // lint
            if (options.lintAssets) {
                lintFile(astFile.dest);
            }

            // minify
            let minFile = astFile.dest.replace('.' + astFile.ext, '.min.' + astFile.ext);
            if (options.minify) {
                minifyFile(astFile.dest);
                if (fsx.existsSync(minFile)) {
                    astFile.stat += ', ' + Math.round(fsx.statSync(minFile).size / 1024) + 'kb minified';
                }
            }

            // gzip
            if (options.gzip) {
                let gzFile = '';
                if (options.minify && fsx.existsSync(minFile)) {
                    gzFile = minFile + '.gz';
                    gzipFile(minFile);
                } else {
                    gzFile = astFile.dest + '.gz';
                    gzipFile(astFile.dest);
                }
                if (fsx.existsSync(gzFile)) {
                    astFile.stat += ', ' + Math.round(fsx.statSync(gzFile).size / 1024) + 'kb gzipped';
                }
            }
            astFile.stat += ')';

            logger(1, '', astFile.stat);
            delete astFile.stat;
        }
        options.current.ado.assets = justNames; // update assets list
    };
    const appendTypes = () => {
        if (options.current.ado.types.length === 0) { return; }

        logger(0, 'types', options.current.ado.types.length);

        // append closure header with settings
        let settings = '';
        if (fsx.existsSync(options.current.asmSettings)) {
            settings = JSON.stringify(fsx.readJSONSync(options.current.asmSettings));
            logger(0, 'settings',  options.current.asmSettings);
        }
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
        if (settings) { // settings is a closure variable of each assembly separately
            closureHeader += 
        `   const settings = JSON.parse('${options.current.settings}'); // eslint-disable-line no-unused-vars\n`;
        } else {
        `   const settings = {}; // eslint-disable-line no-unused-vars\n`;
        }
        appendToFile(closureHeader);

        // append types
        let justNames = [];
        for(let nsFile of options.current.ado.types) {
            justNames.push(nsFile.qualifiedName);
            logger(1, '', nsFile.qualifiedName + ' (./' + nsFile.file + ')'); 

            // read file
            let content = fsx.readFileSync(nsFile.file, 'utf8');

            // find and replace namespace name if set for auto
            content = replaceAll(content, `$$('ns', '(auto)');`, `$$$('ns', '${nsFile.nsName}');`); // replace all is eating up one '$', soo added 3, 2 left after that issues
            content = replaceAll(content, `$$("ns", "(auto)");`, `$$$("ns", "${nsFile.nsName}");`); // replace all is eating up one '$', soo added 3, 2 left after that issues

            // find and replace typename name if set for auto
            content = replaceAll(content, `Class('(auto)'`, `Class('${nsFile.typeName}'`);
            content = replaceAll(content, `Class("(auto)"`, `Class("${nsFile.typeName}"`);

            content = replaceAll(content, `Struct('(auto)'`, `Struct('${nsFile.typeName}'`);
            content = replaceAll(content, `Struct("(auto)"`, `Struct("${nsFile.typeName}"`);

            content = replaceAll(content, `Mixin('(auto)'`, `Mixin('${nsFile.typeName}'`);
            content = replaceAll(content, `Mixin("(auto)"`, `Mixin("${nsFile.typeName}"`);

            content = replaceAll(content, `Enum('(auto)'`, `Enum('${nsFile.typeName}'`);
            content = replaceAll(content, `Enum("(auto)"`, `Enum("${nsFile.typeName}"`);

            content = replaceAll(content, `Interface('(auto)'`, `Interface('${nsFile.typeName}'`);
            content = replaceAll(content, `Interface("(auto)"`, `Interface("${nsFile.typeName}"`);

            // process file injections
            content = injector(nsFile.nsPath, content);            

            // append content to file
            appendToFile(content);
        }
        options.current.ado.types = justNames; // update types list

        // append closure footer
        let closureFooter = 
        `\n` + 
        `})();\n`;
        appendToFile(closureFooter);
    };
    const appendResources = () => {
        if (options.current.ado.resources.length === 0) { return; }

        logger(0, 'resources', options.current.ado.resources.length);        

        // append
        let justNames = [];
        for(let nsFile of options.current.ado.resources) {
            justNames.push(nsFile.qualifiedName);
            logger(1, '', nsFile.qualifiedName + ' (./' + nsFile.file + ')'); 

            // lint resource
            if (options.lintResources) {
                lintFile(nsFile.file);
            }

            // read file
            let encodingType = '',
                content = '';
            if (options.utf8EncodeResourceTypes.indexOf(nsFile.ext) !== -1) {
                content = fsx.readFileSync(nsFile.file, 'utf8');
                encodingType = 'utf8;';
            } else { // no encoding
                content = fsx.readFileSync(nsFile.file);
            }

            // minify resource
            if (options.minifyResources) {
                if (minifyTypes.indexOf(nsFile.ext) !== -1) {
                    if (options.minifyTypes.indexOf(nsFile.ext) !== -1) {
                        switch (nsFile.ext) {
                            case 'js': content = minifyJS(content); break;
                            case 'css': content = minifyCSS(content); break;
                            case 'html': content = minifyHTML(content); break;
                        }
                    }
                }
            }

            // base64 encoding before adding to file
            content = new Buffer(content).toString('base64');
            encodingType += 'base64;';

            // embed resource
            let dump = `flair.Resource.register("${nsFile.qualifiedName}", "${encodingType}", "${'./' + nsFile.file}", "${content}");\n`;
            appendToFile(dump);
        }
        options.current.ado.resources = justNames;
    };
    const appendSelfRegistration = () => {
        if (options.skipRegistrationsFor.indexOf(options.current.asmName) !== -1) { return; } // skip for special cases

        logger(0, 'self-reg', 'yes'); 
        let dump = `flair.Assembly.register('${JSON.stringify(options.current.ado)}');\n`;
        appendToFile(dump);
    };
    const pack = () => {
        options.current.stat = options.current.asm.replace(options.current.dest, '.') + 
                               ' (' + Math.round(fsx.statSync(options.current.asm).size / 1024) + 'kb';

        // lint
        if (options.lint) {
            lintFile(options.current.asm);
        }

        // minify
        let minFile = options.current.asm.replace('.js', '.min.js');
        if (options.minify) {
            minifyFile(options.current.asm);
            options.current.stat += ', ' + Math.round(fsx.statSync(minFile).size / 1024) + 'kb minified';
        }

        // gzip
        let gzFile = minFile + '.gz';
        if (options.gzip) {
            gzipFile(minFile);
            options.current.stat += ', ' + Math.round(fsx.statSync(gzFile).size / 1024) + 'kb gzipped';
        }

        options.current.stat += ')';
    };
    const createPreamble = () => {
        if (options.current.adosJSON.length === 0) { return; }

        logger(0, 'preamble', options.current.preamble.replace(options.current.dest.replace('./', ''), '.'));
        let ados = JSON.stringify(options.current.adosJSON);
        let dump = `(() => { let ados = JSON.parse('${ados}');flair.Assembly.register(ados);})();`;
        fsx.writeFileSync(options.current.preamble, dump);
    };
  

    // const runLint = (asm) => {
    //     let lintReport = eslint.executeOnFiles([asm]);
    //     if (lintReport.errorCount > 0 || lintReport.warningCount > 0) {
    //         logger(eslintFormatter(lintReport.results)); 
    //         if (lintReport.errorCount > 0) {
    //             throw `${lintReport.errorCount} Linting errors found.`;
    //         }
    //     }
    // };
    // const minifyFile = (asm, asm_min, asm_gz) => {
    //     let result = uglifyjs.minify([asm], uglifyConfig);
    //     if (result.error) {
    //         throw `Error minifying ${asm}. \n\n ${result.error}`;
    //     }
    //     fsx.writeFileSync(asm_min, result.code);
    //     if (isGzip) {
    //         fsx.writeFileSync(asm_gz, gz.gzipSync(result.code, gzConfig));
    //     }
    // };
    

    // delete all dest files
    delAll(options.dest);
    logger(0, 'clean', 'done');

    // current item data
    options.current = {};

    // process each group folder
    for(let source of options.sources) {
        if (source.startsWith('_')) { continue; } // ignore if starts with '_'

        // start group
        logger(0, 'group', `${source.replace(source, '.')} (start)`, true);  
        options.current.src = source;
        options.current.dest = source.replace(options.current.src, options.dest);
        options.current.adosJSON = [];
        options.current.preamble = path.join(options.current.dest, 'preamble.js');
            
        // process all assemblies under this group
        let folders = getFolders(options.current.src, true);
        for(let folder of folders) {
            if (folder.startsWith('_')) { continue; } // skip

            // start assembly
            logger(0, 'asm', folder, true); 

            options.current.asmName = folder;
            options.current.asmPath = './' + path.join(options.current.src, options.current.asmName);
            options.current.asm = './' + path.join(options.current.dest, options.current.asmName + '.js');
            options.current.asmMain = './' + path.join(options.current.src, options.current.asmName, 'index.js');
            options.current.asmSettings = './' + path.join(options.current.src, options.current.asmName, 'settings.json');

            // initialize
            fsx.ensureFileSync(options.current.asm);
            appendADO();
            appendHeader();
            appendMain(); // (index.js)

            // process all namespaces under this assembly to 
            let nsFolders = getFolders(options.current.asmPath, true);
            for(let nsFolder of nsFolders) {
                if (nsFolder.startsWith('_')) { continue; } // skip
                if (['-assets', '-bundle'].indexOf(nsFolder) !== -1) { continue; } // skip special folders at namespace level

                options.current.nsName = nsFolder;
                options.current.nsPath = './' + path.join(options.current.asmPath, options.current.nsName);
    
                // collect types and resources 
                let files = rrd(options.current.nsPath);
                for (let file of files) { 
                    if (file.indexOf('/_') !== -1) { continue; } // either a folder or file name starts with '_'. skip it

                    let nsFile = {
                        nsPath: options.current.nsPath,
                        nsName: options.current.nsName,
                        ext: path.extname(file).toLowerCase().substr(1),
                        file: file
                    };
                    if (file.endsWith('.spec.js')) { continue; // ignore specs
                    } else if (file.endsWith('.res.js')) { // js as a resource
                        nsFile.typeName = path.basename(file).replace('.res.js', '');
                        nsFile.type = 'res';
                    } else if (file.endsWith('.js')) { // type
                        nsFile.typeName = path.basename(file).replace('.js', '');
                        nsFile.type = 'type';
                    } else if (file.endsWith('.res.' + nsFile.ext)) { // resource
                        nsFile.typeName = path.basename(file).replace('.res.' + nsFile.ext, '');
                        nsFile.type = 'res';
                    }
                    if (nsFile.type) {
                        if (nsFile.typeName.indexOf('.') !== -1) { throw `Type/Resource names cannot contain dots. (${nsFile.typeName})`; }
                        nsFile.qualifiedName = (options.current.nsName !== '(root)' ? options.current.nsName + '.' : '')  + nsFile.typeName;
                        if (nsFile.type === 'res') {
                            options.current.ado.resources.push(nsFile);
                        } else {
                            options.current.ado.types.push(nsFile);
                        }
                    }
                }
            }
            delete options.current.nsName;
            delete options.current.nsPath;

            // collect all assets
            options.current.astSrc = './' + path.join(options.current.asmPath, '-assets');
            options.current.astDest = './' + path.join(options.current.dest, options.current.asmName);
            if (fsx.existsSync(options.current.astSrc)) {
                let assets = rrd(options.current.astSrc);
                for (let asset of assets) {
                    if (asset.indexOf('/_') !== -1) { continue; } // either a folder or file name starts with '_'. skip it
                    let astFile = {
                        ext: path.extname(asset).toLowerCase().substr(1),
                        src: './' + asset,
                        dest: './' + path.join(options.current.astDest, asset.replace(options.current.astSrc.replace('./', ''), ''))
                    };
                    options.current.ado.assets.push(astFile);
                    
                }
            }
            delete options.current.astSrc;
            delete options.current.astDest;

            // process assets
            processAssets();
              
            // append types, resources and self-registration
            appendTypes();
            appendResources();
            appendSelfRegistration();

            // lint, minify and gzip assembly
            pack();

            logger(0, '==>', options.current.stat, false, true);
        }

        // create group preamble
        createPreamble();

        // done
        logger(0, 'group', `${source.replace(source, '.')} (end)`, true);  
        options.current = {};
    }

    // done
    done();
};

/**
 * @name flairBuild
 * @description Builds flair assemblies as per given configuration
 * @example
 *  flairBuild(options, cb)
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
 *              fullBuild: true/false   - is full build to be done
 *              skipBumpVersion: true/false - if skip bump version with build
 *              suppressLogging: true/false  - if build time log is to be shown on terminal
 *              lint: true/false - if lint operation is to be executed
 *              lintConfig: lint configuration options file path, having structure
 *              {
 *                  "js": {
 *                  },
 *                  "css": {
 *                  },
 *                  "html": {
 *                  }
 *              }
 *                  NOTE: Option configuration comes from: https://eslint.org/docs/user-guide/configuring AND https://eslint.org/docs/developer-guide/nodejs-api#cliengine
 *              lintTypes: - what all types to run linting on - ["js", "css", "html"]
 *              minify: true/false   - is minify to be run
 *              minifyConfig - minify configuration options file path having structure
 *              {
 *                  "js": {
 *                  },
 *                  "css": {
 *                  },
 *                  "html": {
 *                  }
 *              }
 *                  NOTE: Option configuration comes from: https://github.com/mishoo/UglifyJS2#minify-options
 *              minifyTypes: - what all types to run minification on - ["js", "css", "html"]
 *              gzip: true/false     - is gzip to be run
 *              gzipConfig - gzip configuration options file path having structure
 *              {
 *                  "all": {
 *                  },
 *                  "js": {
 *                  },
 *                  "css": {
 *                  },
 *                  "html": {
 *                  }
 *              }
 *                  NOTE: Option configuration comes from: https://nodejs.org/api/zlib.html#zlib_class_options AND https://www.zlib.net/manual.html
 *              gzipTypes: - what all types to run gzip on - ["js", "css", "html", "txt", "xml", "md", "json", "svg", "jpg", "jpeg", "gif", "png"]
 *              lintAssets: true/false     - is assets are to be run lint on
 *              minifyAssets: true/false     - is assets are to be minified
 *              gzipAssets: true/false     - is assets are to be gzipped
 *              lintResources: true/false   - if resources are to be linted before bundeling
 *              minifyResources: true/false - if resources are to be minified before bundeline
 *              utf8EncodeResourceTypes: for what type of resources utf8 encoding can be done - ["txt", "xml", "js", "md", "json", "css", "html", "svg"]
 *              depsConfig - dependencies pull/push configuration options file path having structure
 *              {
 *                  pre:[] - each item in here should have structure as: { src, dest }
 *                           NOTE:
 *                                src: can be a web url or a local file path (generally a web url to download an external dependency to embed)
 *                                dest: local file path (generally an embedded dependency)
 *                  post: [] - each item in here should have structure as: { src, dest }
 *                            NOTE:
 *                                src:  local file path (generally the built files)
 *                                dest: local file path (generally copied to some other local folder)
 *                  }
 *              preBuildDeps: true/false   - if before the start of assembly building, all local copies of external dependencies  need to be refreshed 
 *              postBuildDeps: true/false  - if after build update other local copies using the built files
 *              package: path of packageJSON file of the project
 *                  it picks project name, version and copyright information etc. from here to place on assembly
 * 
 *              NOTE: All local paths must be related to root of the project
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
 *                          (root)     - root namespace folder, is a special folder, that contains special members
 *                                       which are placed on root only. Should be avoided, as this is for flair's own
 *                                       system types
 *                          -assets   - assets folder
 *                                  > this special folder can be used to place all external assets like images, css, js, third-party
 *                                    libraries, fonts, etc.
 *                                  > it can have any structure underneath
 *                                  > all files and folder under it, are copied to destination under <assemnly folder> folder
 *                                  > which means, if an assembly has assets, in destination folder, it will look like:
 *                                      <assembly folder>.js        - the assembly file
 *                                      <assembly folder>.min.js    - the assembly file (minified)
 *                                      <assembly folder>/          - the assembly's assets folder content here under (this is created only if assets are defined)
 *                                  > note, '-assets' folder itself is not copied, but all contents underneath are copied
 *                          -bundle   - bundled files' folder
 *                                  > this special folder can be used to place all files that are being bundled via injections inside index.js file
 *                                  > it can have any structure underneath
 *                                  > all files and folder under it, are skipped, unless they are referred via 
 *                                    <!-- inject: <file> --> pattern in any type or in index.js file
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
    // build options
    options = options || {};
    options.engine = options.engine || '';
    options.package = options.package || './package.json';

    options.dest = options.dest || './dist';
    options.src = options.src || './src';
    options.processAsGroups = options.processAsGroups || false; // if true, it will treat first level folders under src as groups and will process each folder as group, otherwise it will treat all folders under src as individual assemblies

    options.fullBuild = options.fullBuild || false;
    options.skipBumpVersion = options.skipBumpVersion || false;
    options.suppressLogging = options.suppressLogging || false;

    options.lint = options.lint !== undefined ? options.lint : true;
    options.lintConfig = options.lintConfig || '';
    options.lintTypes = options.lintTypes || ["js", "css", "html"];

    options.minify = options.minify !== undefined ? options.minify : true;
    options.minifyConfig = options.minifyConfig || '';
    options.minifyTypes = options.minifyTypes || ["js", "css", "html"];

    options.gzip = options.gzip || false;
    options.gzipConfig = options.gzipConfig || '';
    options.gzipTypes = options.gzipTypes || ["js", "css", "html", "txt", "xml", "md", "json", "svg", "jpg", "jpeg", "gif", "png"];

    options.lintAssets = options.lintAssets || false;    
    options.minifyAssets = options.minifyAssets || false;    
    options.gzipAssets = options.gzipAssets || false;    

    options.lintResources = options.lintResources !== undefined ? options.lintResources : true;
    options.minifyResources = options.minifyResources !== undefined ? options.minifyResources : true;
    options.utf8EncodeResourceTypes = options.utf8EncodeResourceTypes || ["txt", "xml", "js", "md", "json", "css", "html", "svg"];

    options.depsConfig = options.depsConfig || '';
    options.preBuildDeps = options.preBuildDeps || false;    
    options.postBuildDeps = options.postBuildDeps || false;

    // full-build vs quick build settings
    if (options.fullBuild) { // full build - ensure these things happen, if configured, even if turned off otherwise
        options.lint = options.lintConfig ? true : false;
        options.minify = options.minifyConfig ? true : false;
        options.gzip = options.gzipConfig ? true : false;
        options.preBuildDeps = options.depsConfig ? true : false;
        options.postBuildDeps = options.depsConfig ? true : false;
        options.lintResources = options.lint && options.lintResources;
        options.minifyResources = options.minify && options.minifyResources;
        options.minifyAssets = options.minify && options.minifyAssets;
        options.gzipAssets = options.gzip && options.gzipAssets;
    } else { // quick build - suppress few things
        options.lintResources = options.lint && options.lintResources;
        options.skipBumpVersion = true;
        options.suppressLogging = true;
        options.minify = false;
        options.gzip = false;
        options.minifyAssets = false;
        options.gzipAssets = false;
        options.minifyResources = false;
        options.preBuildDeps = false;
        options.postBuildDeps = false;
    }

    // exclude flair files from being registered
    options.skipRegistrationsFor = [
        'flair',
        'flair.build'
    ];

    // define logger
    const logger = (level, msg, data, prlf, polf) => {
        if (options.suppressLogging) { return; }

        let colLength = 15;
        msg = ' '.repeat(colLength - msg.length) + msg + (level === 0 ? ': ' : '');
        if (level !== 0) { data = '- ' + data; }
        msg = msg + '  '.repeat(level) + data.toString();
        if (prlf) { msg = '\n' + msg; }
        if (polf) { msg += '\n'; }
        console.log(msg);   // eslint-disable-line no-console
    };
    options.logger = logger;

    // process options with their resolved values
    options.packageJSON = fsx.readJSONSync(path.resolve(options.package));
    options.lintConfig = options.lintConfig ? fsx.readJSONSync(path.resolve(options.lintConfig)) : null;
    options.minifyConfig = options.minifyConfig ? fsx.readJSONSync(path.resolve(options.minifyConfig)) : null;
    options.gzipConfig = options.gzipConfig ? fsx.readJSONSync(path.resolve(options.gzipConfig)) : null;
    options.depsConfig = options.depsConfig ? fsx.readJSONSync(path.resolve(options.depsConfig)) : null;

    // lint
    if (options.lint && options.lintConfig) {
        if (options.lintTypes.indexOf('js') !== -1) { // JS lint
            const CLIEngine = new require('eslint').CLIEngine            
            options.eslint = new CLIEngine(options.lintConfig.js);
            options.eslintFormatter = options.eslint.getFormatter();
        }
        if (options.lintTypes.indexOf('css') !== -1) { // CSS lint
            // TODO
        }
        if (options.lintTypes.indexOf('html') !== -1) { // HTML lint
            // TODO
        }
    }

    // minify
    if (options.minify && options.minifyConfig) {
        if (options.minifyTypes.indexOf('js') !== -1) { // JS lint
            options.uglify = require('uglify-js-harmony')
        }
        if (options.minifyTypes.indexOf('css') !== -1) { // CSS lint
            // TODO
        }
        if (options.minifyTypes.indexOf('html') !== -1) { // HTML lint
            // TODO
        }        
    }

    // gzip
    if (options.gzip && options.gzipConfig) {
        options.zlib = require('zlib');
    }    

    // start
    logger(0, 'flairBuild', 'start', true);    

    // build source list
    let srcList = [];
    if (options.processAsGroups) {
        srcList = getFolders(options.src, true); // list of all group folders
    } else {
        srcList.push(options.src);  // this itself is a group folder
    }
    options.sources = srcList;

    // bump version number
    bump(options);
    
    // build
    copyDeps(false, options, () => {
        build(options, () => {
            copyDeps(true, options, () => {
                logger(0, 'flairBuild', 'end', true, true);
                if (typeof cb === 'function') { cb(); } 
            });
        });
    });
};