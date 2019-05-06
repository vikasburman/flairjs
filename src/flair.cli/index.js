/**
 * @preserve
 * <<name>>
 * <<desc>>
 * 
 * Assembly: <<asm>>
 *     File: <<file>>
 *  Version: <<version>>
 *  <<lupdate>>
 * 
 * <<copyright>>
 * <<license>>
 */
(function(root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(factory);
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = factory(); // Node.js specific `module.exports`
        }
        module.exports = exports = factory(); // CommonJS        
    } else { // expose as global on window
        root.flairBuild = factory();
    }
})(this, function() {
    'use strict';

    // includes
    const rrd = require('recursive-readdir-sync'); 
    const copyDir = require('copy-dir');
    const path = require('path');
    const fsx = require('fs-extra');
    const del = require('del');

    // asm build info
    const buildInfo = {
        name: 'flairBuild',
        version: '1',
        format: 'fasm',
        formatVersion: '1',
        contains: [
            'init',         // index.js is bundled outside closure, which can have injected dependencies
            'func',         // functions.js is bundled in closure, which can have local closure functions as well as a special named function 'onLoadComplete'
            'type',         // types are embedded
            'vars',         // flair variables are made available in a closure where types are bundled
            'reso',         // resources are bundled
            'asst',         // assets are processed and their names are added in ado
            'rout',         // routes are collected, and added in ado
            'sreg'          // selfreg code is bundled
        ]
    };    

    // template: assembly module wrapper (start)
const asm_index = `
/**
 * @preserve
 * <<title>>
 * <<desc>>
 * 
 * Assembly: <<asm>>
 *     File: <<file>>
 *  Version: <<version>>
 *  <<lupdate>>
 * 
 * <<copyright>>
 * <<license>>
 */
(function(root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(factory);
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = factory; // Node.js specific module.exports
        }
        module.exports = exports = factory; // CommonJS        
    } else { // expose as global on window
        root['<<asm>>'] = factory;
    }
})(this, async function() {
    'use strict';
    
    // assembly closure init (start)
    /* eslint-disable no-unused-vars */
    
    // flair object
    const flair = (typeof global !== 'undefined' ? require('<<package>>') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
    
    // flair types, variables and functions
    const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
            Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
            isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
            getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
    const { TaskInfo } = flair.Tasks;
    const { env } = flair.options;
    const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, guid, isArrowFunc, isASyncFunc, sieve,
            b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
    
    // inbuilt modifiers and attributes compile-time-safe support
    const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
            $$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
            $$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;
    
    // access to DOC
    const DOC = ((env.isServer || env.isWorker) ? null : window.document);

    // current for this assembly
    const __currentContextName = AppDomain.context.current().name;
    const __currentFile = (env.isServer ? __filename : window.document.currentScript.src.replace(window.document.location.href, './'));
    const __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
    AppDomain.loadPathOf('<<asm>>', __currentPath);

    // settings of this assembly
    let settings = JSON.parse('<<settings>>');
    let settingsReader = flair.Port('settingsReader');
    if (typeof settingsReader === 'function') {
        let externalSettings = settingsReader('<<asm>>');
        if (externalSettings) { settings = Object.assign(settings, externalSettings); }
    }
    settings = Object.freeze(settings);

    // config of this assembly
    let config = JSON.parse('<<config>>');
    config = Object.freeze(config);

    /* eslint-enable no-unused-vars */
    // assembly closure init (end)

    // assembly global functions (start)
    <<asm_functions>>
    // assembly global functions (end)

    // set assembly being loaded
    AppDomain.context.current().currentAssemblyBeingLoaded('<<which_file>>');

    // assembly types (start)
    <<asm_types>>
    // assembly types (end)

    // assembly embedded resources (start)
    <<asm_resources>>
    // assembly embedded resources (end)        

    // clear assembly being loaded
    AppDomain.context.current().currentAssemblyBeingLoaded('');

    // register assembly definition object
    AppDomain.registerAdo('<<ado>>');

    // assembly load complete
    if (typeof onLoadComplete === 'function') { 
        onLoadComplete();   // eslint-disable-line no-undef
    } 
});
`;
    // template: assembly module wrapper (end)

    // template: assembly type wrapper (start)
    const asm_type = `
    await (async () => { // type: <<file>>
    <<asm_type>>
    })();
    `;
    // template: assembly type wrapper (end)

    // template: assembly embedded resource wrapper (start)
    const asm_res = `
    // resource: <<file>>
    AppDomain.context.current().registerResource(JSON.parse('<<asm_res>>'));
    `;
    // template: assembly embedded resource wrapper (end)    

    // template: preamble file wrapper (start)
const asm_preamble_file = `
/**
 * @preserve
 * Preamble for assemblies at: <<path>>
 * Created: <<lupdate>>
 */
(() => {
    const flair = (typeof global !== 'undefined' ? require('<<package>>') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
    flair.AppDomain.registerAdo(...JSON.parse('<<ados>>'));}
})();
`;
    // template: preamble file wrapper (end)    

    // support functions
    const getFolders = (root, excludeRoot) => {
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
    const delAll = (root) => {
    del.sync([root + '/**', '!' + root]);
    };
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");  // eslint-disable-line no-useless-escape
    };
    const replaceAll = (string, find, replace) => {
        return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
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

    // core engine
    const bump = (options) => {
        if (options.skipBumpVersion) { return; }
    
        // bump version
        let ver = options.packageJSON.version.split('.');
        ver[0] = parseInt(ver[0]);
        ver[1] = parseInt(ver[1]);
        ver[2] = parseInt(ver[2]);
        if (ver[2] >= 99) {
            ver[2] = 0
            if (ver[1] >= 99) {
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
                let item = items.shift(); // {src, dest, exclude}
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
                            fsx.writeFileSync(dest, body, 'utf8'); // overwrite
                            processNext(items);
                        });
                    }).on('error', (e) => {
                        throw `Failed to fetch dependency: ${item.src}. \n\n ${e}`;
                    });
                } else { // local file / folder path
                    let src = path.resolve(item.src),
                        dest = path.resolve(item.dest),
                        exclude = item.exclude,
                        minFile = '';
                    if (fsx.lstatSync(src).isDirectory()) {
                        delAll(dest); // delete all content inside
                        fsx.ensureDirSync(dest);
                        copyDir.sync(src, dest, (state, filepath, filename) => { // copy
                            let result = true;
                            // maps
                            if (exclude.maps && path.extname(filename) === '.map') { result = false; }
    
                            // un-min: for every js file, check if it's .min version exists at same path, don't copy this file, as .min.js might have been copied or will be copied
                            if (result && exclude["un-min"] && path.extname(filename) === '.js' && !path.extname(filename).endsWith('.min.js')) {
                                minFile = filepath.substr(0, filepath.length - 3) + '.min.js'; // remove .js and add .min.js
                                if (fsx.existsSync(minFile)) { result = false; }
                            }
    
                            // pattern
                            if (result) {
                                for(let pattern of exclude.patterns) {
                                    if (pattern.startsWith('*')) {
                                        pattern = pattern.substr(1); // remove *
                                        if (filename.endsWith(pattern)) { result = false; break; }
                                    } else if (pattern.endsWith('*')) {
                                        pattern = pattern.substr(0, pattern.length - 1); // remove *
                                        if (filename.startsWith(pattern)) { result = false; break; }
                                    } else {
                                        if (filename === pattern) { result = false; break; }
                                    }
                                }
                            }
    
                            // ok
                            return result;
                        }); 
                    } else {
                        fsx.ensureDirSync(path.dirname(dest));
                        fsx.copyFileSync(src, dest); // overwrite
                    }
                    processNext(items);
                }
            } else {
                done();
            }
        };
    
        processNext(deps);
    };        
    const build = async (options, buildDone) => {
        // logging
        const logger = options.logger

        // lint, minify and gzip
        const lintJS = (file) => {
            return new Promise((resolve, reject) => {
                let lintReport = options.lintJS.executeOnFiles([file]);
                if (lintReport.errorCount > 0 || lintReport.warningCount > 0) {
                    console.log(options.eslintFormatter(lintReport.results)); // eslint-disable-line no-console
                    reject(`Lint for ${file} failed.`); 
                }
                resolve();
            });
        };
        const lintCSS = (file) => { // eslint-disable-line no-unused-vars
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                options.lintCSS({
                    files: [file],
                    config: options.lintConfig.css
                }).then((result) => {
                    if (result.errored) { 
                        console.log(result.output); // eslint-disable-line no-console
                        reject(`Lint for ${file} failed.`); 
                    } else {
                        resolve();
                    }
                }).catch(reject);
            });
        };
        const lintHTML = (file) => { 
            return new Promise((resolve, reject) => {
                let content = fsx.readFileSync(file, 'utf8');
                options.lintHTML(content, options.lintConfig.html).then((errors) => {
                    if (errors && errors.length > 0) {
                        // HACK: some rules after being set to false are still showing up in errors,
                        // filter them
                        let finalErrors = [];
                        errors.forEach(item => {
                            let rule = item.rule || item.data.name;
                            if (typeof options.lintConfig.html[rule] !== 'undefined' && options.lintConfig.html[rule] === false) { return; }
                            finalErrors.push(item);
                        });
                        if (finalErrors.length > 0) {
                            console.log(finalErrors); // eslint-disable-line no-console
                            reject(`Lint for ${file} failed.`); 
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                }).catch(reject);
            });
        };
        const minifyJS = (file, mapFile, mapFileUrl) => {
            return new Promise((resolve, reject) => {
                let content = fsx.readFileSync(file, 'utf8');
                if (options.generateJSSourceMap && mapFile) {
                    options.minifyConfig.js.sourceMap = {
                        root: '',
                        url: mapFileUrl
                    };
                }
                let result = options.minifyJS(content, options.minifyConfig.js);
                if (options.generateJSSourceMap && mapFile) {
                    delete options.minifyConfig.js.sourceMap;
                }
                if (result.error) { 
                    console.log(result.error); // eslint-disable-line no-console
                    reject(`Minify for ${file} failed.`); 
                } else {
                    if (options.generateJSSourceMap && mapFile && result.map) {
                        fsx.writeFileSync(mapFile, result.map, 'utf8');
                    }
                    resolve(result.code);
                }
            });
        };
        const minifyCSS = (file) => {
            return new Promise((resolve, reject) => {        
                let content = fsx.readFileSync(file, 'utf8');
                let result = new options.minifyCSS(options.minifyConfig.css).minify(content);
                if (result.errors.length > 0) { 
                    console.log(result.errors); // eslint-disable-line no-console
                    reject(`Minify for ${file} failed.`); 
                } else {
                    resolve(result.styles); 
                }
            });
        };
        const minifyHTML = (file) => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars           
                let content = fsx.readFileSync(file, 'utf8');
                let result = options.minifyHTML(content, options.minifyConfig.html);
                resolve(result);
            });
        };
        const lintFile = (src) => {
            return new Promise((resolve, reject) => { 
                // run lint only if either fullBuild OR this file is changed since last build
                if (!options.fullBuild && options.current.asmLupdate) {
                    let srcLupdate = fsx.statSync(src).mtime;
                    if (srcLupdate < options.current.asmLupdate) { resolve(); return; }
                }
    
                let ext = path.extname(src).substr(1);
                if (options.lintTypes.indexOf(ext) !== -1) {
                    switch(ext) {
                        case 'js': lintJS(src).then(resolve).catch(reject); break;
                        case 'css': lintCSS(src).then(resolve).catch(reject); break;
                        case 'html': lintHTML(src).then(resolve).catch(reject); break;
                        default: resolve(); break;
                    }
                } else {
                    resolve();
                }
            });
        };
        const minifyFile = (src) => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                let ext = path.extname(src).substr(1),
                    dest = src.replace('.' + ext, '.min.' + ext),
                    mapFile = dest + '.map',
                    mapFileUrl = mapFile.replace(options.current.dest, '.');
                if (options.minifyTypes.indexOf(ext) !== -1) {
                    let p = null;
                    switch(ext) {
                        case 'js': p = minifyJS(src, mapFile, mapFileUrl); break;
                        case 'css': p = minifyCSS(src); break;
                        case 'html': p = minifyHTML(src);  break;
                    }
                    if (p === null) {
                        resolve('');
                    } else {
                        p.then((content) => {
                            fsx.writeFileSync(dest, content, 'utf8');
                            resolve(content);
                        }).catch(reject);
                    }
                } else {
                    resolve('');
                }
            });
        };
        const gzipFile = (src) => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                let content = fsx.readFileSync(src, 'utf8'),
                    ext = path.extname(src).substr(1),
                    dest = src + '.gz';
                if (options.gzipTypes.indexOf(ext) !== -1) {
                    let gzConfig = options.gzipConfig[ext] || options.gzipConfig.all; // pick ext specific configuration or generic (all)
                    fsx.writeFileSync(dest, options.zlib.gzipSync(content, gzConfig));
                }
                resolve();
            });
        };
    
        // process namespaces
        const processNamespaces = (done) => {
            if (options.current.namespaces.length === 0) { 
                delete options.current.nsName;
                delete options.current.nsPath;
    
                // sort namespace items of types by index, so they are added in right required order
                // since only types have mutual dependency, only types are considered for sorting
                // even if number was added by user on some other type, it is ignored for now
                options.current.ado.types.sort((a, b) => { 
                    if (a.index < b.index) { return -1; }
                    if (a.index > b.index) { return 1; }
                    return 0;
                });
    
                done(); return; 
            }

            // support functions
            const resolveRootNS = (isAddDot) => {
                let rootNS = ''; // root namespace is always without any name, no matter which assembly
                if (rootNS && isAddDot) { rootNS += '.'; }
                return rootNS;
            };
            const collectTypesAndResourcesAndRoutes = () => {
                let files = rrd(options.current.nsPath);
                for (let file of files) { 
                    if (file.indexOf('/_') !== -1) { continue; } // either a folder or file name starts with '_'. skip it
        
                    // handle position first
                    let index = 999999999, // all are at bottom by default
                        filePath = path.dirname(file),
                        fileName = path.basename(file),
                        originalFile = file;
                    if (fileName.startsWith('@')) { // file name can be given @n- to help sorting a file before others - this helps in right bundeling order
                        let idx = fileName.indexOf('-');
                        if (idx !== -1) {
                            index = parseInt(fileName.substr(1, idx-1));
                            fileName = fileName.substr(idx+1);
                            file = path.join(filePath, fileName);
                        }
                    }
        
                    let nsFile = {
                        nsPath: options.current.nsPath,
                        nsName: options.current.nsName,
                        ext: path.extname(file).toLowerCase().substr(1),
                        originalFile: originalFile,
                        file: file,
                        index: index
                    };
                    
                    if (file.endsWith('/routes.json')) { // routes definition
                        nsFile.type = 'routes';
                    } else if (file.endsWith('.spec.js')) { continue; // ignore specs
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
                    if (nsFile.type !== 'routes') {
                        if (nsFile.typeName.indexOf('.') !== -1) { throw `Type/Resource names cannot contain dots. (${nsFile.typeName})`; }
                        nsFile.qualifiedName = (options.current.nsName !== '(root)' ? options.current.nsName + '.' : resolveRootNS(true))  + nsFile.typeName;
        
                        if (nsFile.type === 'res') {
                            options.current.ado.resources.push(nsFile);
                        } else {
                            options.current.ado.types.push(nsFile);
                        }
                    } else {
                        let allRoutes = fsx.readJSONSync(nsFile.file, 'utf8');
                        let routes = [];
                        // routes.json named files can be placed anywhere inside an assembly
                        // all these files will eventually be read and merged and all routes be 
                        // registered
                        // structure of the file should be:
                        // [
                        //      { .. route definition .. },
                        //      { .. route definition .. }
                        // ]
                        // Each route Definition can be:
                        // {
                        //   name: route name, to access route programatically, it will be prefixed with namespace under which this routes.json is kept
                        //   mount: route root mount name - by default it is 'main', as per config.json setting, it can be any other mount also (each mount is a different express/page app for server/client)
                        //   path: route path in relation to mount
                        //   handler: qualified type name that handles this route
                        //      handler can be of any class that is derived from Handler base class
                        //   verbs: name of the verbs supported on this route, like get, post, etc. - handler must have the same name methods to handle this verb - methods can be sync or async
                        //   index: any + or - number to move routes up or down wrt other routes, all routes from all assemblies are sorted by index before being activated
                        //      routes are indexed first and then applied in context of their individual mount
                        //      mount's order in config ultimately defines the overall order first than the index of the route itself inside the mount
                        for(let route of allRoutes) { // add each route separately
                            if (route.name.indexOf('.') !== -1) { throw `Route name cannot contain dots. (${route.name})`; }
                            if (!route.path) { throw `Route path must be defined. (${route.name}`; }
                            if (!route.handler) { throw `Route handler must be defined. (${route.name}`; }
                            route.qualifiedName = (options.current.nsName !== '(root)' ? options.current.nsName + '.' : resolveRootNS(true))  + route.name;
                            routes.push({ 
                                name: route.qualifiedName,
                                mount: route.mount || 'main', // by default all routes mount to main
                                index: route.index || 0, // no index means all are at same level
                                verbs: route.verbs || [], // verbs, e.g., view / get / post, etc.
                                path: route.path, 
                                handler: route.handler
                            });
                        }
                        options.current.ado.routes.push({
                            nsPath: options.current.nsPath,
                            nsName: options.current.nsName,
                            file: file,
                            data: routes
                        });
                    }
                }
            };            

            // define namespace to process
            let nsFolder = options.current.namespaces.splice(0, 1)[0]; // pick from top
            if (nsFolder.startsWith('_')) { processNamespaces(done); return; } // ignore if starts with '_'
            if (['(assets)', '(libs)', '(bundle)', '(..)'].indexOf(nsFolder) !== -1) { processNamespaces(done); return; } // skip special folders at namespace level
    
            options.current.nsName = nsFolder;
            options.current.nsPath = './' + path.join(options.current.asmPath, options.current.nsName);
    
            // collect types and resources and routes
            collectTypesAndResourcesAndRoutes();
    
            // pick next
            processNamespaces(done); 
        };

        // process assemblies
        const processAssemblies = (done) => {
            if (options.current.assemblies.length === 0) { done(); return; }

            // support functions
            const appendADO = () => {
                // each ADO object has:
                //      "name": "", 
                //      "file": "",
                //      "mainAssembly": "",
                //      "desc": "",
                //      "title": "",
                //      "version": "",
                //      "lupdate": "",
                //      "builder": ""
                //      "copyright": "",
                //      "license": "",
                //      "types": ["", "", ...],
                //      "resources": ["", "", ...],
                //      "assets": ["", "", ...],
                //      "routes": [{}, {}, ...]
                options.current.ado = {
                    name: options.current.asmName,
                    file: options.current.asmFileName.replace('.js', '{.min}.js'),
                    mainAssembly: options.mainAssembly,
                    desc: options.packageJSON.description,
                    title: options.packageJSON.title,
                    version: options.packageJSON.version,
                    lupdate: new Date().toUTCString(),
                    builder: buildInfo,
                    copyright: options.packageJSON.copyright,
                    license: options.packageJSON.license,
                    types: [],
                    resources: [],
                    assets: [],
                    routes: []
                };
        
                if (options.skipPreambleFor.indexOf(options.current.asmName) === -1) { // if not to be skipped for preamble
                    options.current.adosJSON.push(options.current.ado);
                }
            };            
            const collectAssets = () => {
                let assetsInfo = [],
                    astSrc = './' + path.join(options.current.asmPath, '(assets)'),
                    astDest = './' + path.join(options.current.dest, options.current.asmName);
                
                if (fsx.existsSync(astSrc)) {
                    let assets = rrd(astSrc);
                    for (let asset of assets) {
                        if (asset.indexOf('/_') !== -1) { continue; } // either a folder or file name starts with '_'. skip it
                        
                        // asset file info
                        let astFile = {
                            ext: path.extname(asset).toLowerCase().substr(1),
                            src: './' + asset,
                            dest: './' + path.join(astDest, asset.replace(astSrc.replace('./', ''), ''))
                        };
                        assetsInfo.push(astFile);
                    }
                }

                // done
                return assetsInfo;
            };            
            const processAssets = (cb, justNames) => {
                justNames = justNames || [];
                if (options.current.ado.assets.length === 0) { 
                    options.current.ado.assets = justNames;
                    cb(); return; 
                }

                // define asset to process
                let astFile = options.current.ado.assets.splice(0, 1)[0]; // pick from top
                justNames.push(astFile.dest.replace(options.current.dest, '.'));
        
                // process only if full build OR asset is changed
                if (!options.fullBuild && fsx.existsSync(astFile.dest)) {
                    let srcLupdate = fsx.statSync(astFile.src).mtime.toString(),
                        destLupdate = fsx.statSync(astFile.dest).mtime.toString();
                    if (srcLupdate === destLupdate) { processAssets(cb, justNames); return; }
                }
                if (!options.current.isAssetsHeadingPrinted) { logger(0, 'assets', ''); options.current.isAssetsHeadingPrinted = true; }
        
                // process asset info
                fsx.ensureDirSync(path.dirname(astFile.dest)); // ensure dest folder exists
                fsx.copyFileSync(astFile.src, astFile.dest);
                astFile.stat = astFile.dest.replace(options.current.dest, '.') + 
                ' (' + Math.round(fsx.statSync(astFile.dest).size / 1024) + 'kb';
        
                let minFile = '';
                const afterGzip = () => {
                    astFile.stat += ')';
        
                    logger(1, '', astFile.stat);
                    delete astFile.stat;
        
                    processAssets(cb, justNames); // pick next
                };
                const afterMinify = () => {
                    // gzip
                    let gzFile = '';
                    if (options.gzip && !options.current.skipMinify && !options.current.skipMinifyThisAssembly) {
                        if (options.minify && fsx.existsSync(minFile)) {
                            gzFile = minFile + '.gz';
                            gzipFile(minFile).then(() => {
                                if (fsx.existsSync(gzFile)) {
                                    astFile.stat += ', ' + Math.round(fsx.statSync(gzFile).size / 1024) + 'kb gzipped';
                                }
                                afterGzip();
                            }).catch((err) => { throw err; })
                        } else {
                            gzFile = astFile.dest + '.gz';
                            gzipFile(astFile.dest).then(() => {
                                if (fsx.existsSync(gzFile)) {
                                    astFile.stat += ', ' + Math.round(fsx.statSync(gzFile).size / 1024) + 'kb gzipped';
                                }
                                afterGzip();
                            }).catch((err) => { throw err; });
                        }
                    } else { // delete old existing
                        if (!options.fullBuild) { 
                            gzFile = minFile + '.gz';
                            if (fsx.existsSync(gzFile)) { 
                                fsx.removeSync(gzFile); 
                            } else {
                                gzFile = astFile.dest + '.gz';
                                if (fsx.existsSync(gzFile)) { fsx.removeSync(gzFile); }
                            }
                        }
                        afterGzip();
                    }
                };
                const afterLint = () => {
                    // minify
                    minFile = astFile.dest.replace('.' + astFile.ext, '.min.' + astFile.ext);
                    if (options.minify && !options.current.skipMinify && !options.current.skipMinifyThisAssembly) {
                        minifyFile(astFile.dest).then(() => {
                            if (fsx.existsSync(minFile)) {
                                astFile.stat += ', ' + Math.round(fsx.statSync(minFile).size / 1024) + 'kb minified';
                            }
                            afterMinify();
                        }).catch((err) => { throw err; });
                    } else { // delete old existing
                        if (!options.fullBuild && fsx.existsSync(minFile)) { fsx.removeSync(minFile); }
                        let mapFile = minFile + '.map';
                        if (!options.fullBuild && fsx.existsSync(mapFile)) { fsx.removeSync(mapFile); }
                        afterMinify();
                    }
                };
        
                // lint
                if (options.lintAssets) {
                    lintFile(astFile.dest).then(afterLint).catch((err) => { throw err; });
                } else {
                    afterLint();
                }
            };  
            const copyLibs = () => {
                let libsSrc = './' + path.join(options.current.asmPath, '(libs)'),
                    libsDest = './' + path.join(options.current.dest, options.current.asmName);
                
                if (fsx.existsSync(libsSrc)) {
                    logger(0, 'libs', libsSrc);
                    let libs = rrd(libsSrc);
                    for (let lib of libs) {
                        if (lib.indexOf('/_') !== -1) { continue; } // either a folder or file name starts with '_'. skip it
                        
                        // lib file info
                        let libFile = {
                            ext: path.extname(lib).toLowerCase().substr(1),
                            src: './' + lib,
                            dest: './' + path.join(libsDest, lib.replace(libsSrc.replace('./', ''), ''))
                        };
                        fsx.copySync(libFile.src, libFile.dest, { errorOnExist: true })
                    }
                }
            };
            const copyRootFiles = () => {
                let rootSrc = './' + path.join(options.current.asmPath, '(..)'),
                    rootDest = options.current.dest;

                if (fsx.existsSync(rootSrc)) {
                    logger(0, 'root', rootSrc); 
                    let rootFiles = rrd(rootSrc);
                    for (let rootFile of rootFiles) {
                        if (rootFile.indexOf('/_') !== -1) { continue; } // either a folder or file name starts with '_'. skip it
                        
                        // root file info
                        let rFile = {
                            ext: path.extname(rootFile).toLowerCase().substr(1),
                            src: './' + rootFile,
                            dest: './' + path.join(rootDest, rootFile.replace(rootSrc.replace('./', ''), ''))
                        };
                        fsx.copySync(rFile.src, rFile.dest, { errorOnExist: true })
                    }
                }
            };
            const initializeAssemblyContent = () => {
                // create assembly wrapper
                // if index.js exists, this is the custom wrapper, use it, else
                // define default wrapper
                if (fsx.existsSync(options.current.asmMain)) {
                    options.current.asmContent = fsx.readFileSync(options.current.asmMain, 'utf8');
                } else {
                    options.current.asmContent = asm_index; // template
                }

                // replace placeholders
                options.current.asmContent = replaceAll(options.current.asmContent, '<<name>>',  options.packageJSON.name);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<title>>',  options.current.ado.title);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<desc>>',  options.current.ado.desc);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<asm>>', options.current.ado.name);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<file>>', options.current.asmFileName);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<version>>', options.current.ado.version);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<lupdate>>', options.current.ado.lupdate);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<copyright>>', options.current.ado.copyright);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<license>>', options.current.ado.license);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<package>>', options.packageJSON.name);
                options.current.asmContent = replaceAll(options.current.asmContent, '<<which_file>>', options.current.ado.file);

                // process file injections
                options.current.asmContent = injector(options.current.asmPath, options.current.asmContent); 

                // inject settings
                if (fsx.existsSync(options.current.asmSettings)) {
                    options.current.asmContent = replaceAll(options.current.asmContent, '<<settings>>', JSON.stringify(fsx.readJSONSync(options.current.asmSettings)));
                    logger(0, 'settings',  options.current.asmSettings);
                } else {
                    options.current.asmContent = replaceAll(options.current.asmContent, '<<settings>>', '{}');
                }

                // inject config
                if (fsx.existsSync(options.current.asmConfig)) {
                    options.current.asmContent = replaceAll(options.current.asmContent, '<<config>>', JSON.stringify(fsx.readJSONSync(options.current.asmConfig)));
                    logger(0, 'config',  options.current.asmConfig);
                } else {
                    options.current.asmContent = replaceAll(options.current.asmContent, '<<config>>', '{}');
                }

                // inject global functions
                if (fsx.existsSync(options.current.functions)) {
                    options.current.asmContent = replaceAll(options.current.asmContent, '<<asm_functions>>', `<!-- inject: ${options.current.functions} --> `);
                    options.current.asmContent = injector('./', options.current.asmContent);
                    logger(0, 'functions', options.current.functions); 
                } else {
                    options.current.asmContent = replaceAll(options.current.asmContent, '<<asm_functions>>', '// (not defined)');
                }
            };
            const finalizeAssemblyContent = () => {
                // inject ado
                options.current.asmContent = replaceAll(options.current.asmContent, '<<ado>>', JSON.stringify(options.current.ado));
            };
            const injectTypes = (cb) => {
                if (options.current.ado.types.length === 0) { cb(); return; }
                
                // start
                logger(0, 'types', '');
        
                // append types
                let justNames = [],
                    thisFile = '',
                    allTypes = '';
                for(let nsFile of options.current.ado.types) {
                    justNames.push(nsFile.qualifiedName);
                    thisFile = './' + nsFile.originalFile;
                    logger(1, '', nsFile.qualifiedName + ' (' + thisFile + ')');
        
                    // wrap type in type wrapper
                    // using injector way of injecting content, as this 
                    // does not mess with '$' issue, which otherwise by reading file
                    // and replacing content, cause problem
                    // more about the issue at: https://stackoverflow.com/questions/5297856/replaceall-in-javascript-and-dollar-sign
                    let content = replaceAll(asm_type, '<<asm_type>>', `<!-- inject: ${thisFile} -->`);
                    content = replaceAll(content, '<<file>>', thisFile);
                    content = injector('./', content);
                    content = replaceAll(content, '$(', '$$$('); // replace all messed-up calls with correct $$$( eventually becomes $$(
        
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
        
                    // process type injections, if any
                    content = injector(nsFile.nsPath, content);
        
                    // append content to all list
                    allTypes += content;
                }
                options.current.ado.types = justNames; // update types list

                // inject types
                options.current.asmContent = replaceAll(options.current.asmContent, '<<asm_types>>', allTypes);
        
                // done
                cb();
            };  
            const injectResources = (cb, justNames, allResources) => {
                justNames = justNames || [];
                allResources = allResources || '';
                if (options.current.ado.resources.length === 0) { 
                    options.current.ado.resources = justNames; // update resources list

                    // inject resources
                    options.current.asmContent = replaceAll(options.current.asmContent, '<<asm_resources>>', allResources);

                    // done
                    cb(); return; 
                }

                // define resource to process
                let nsFile = options.current.ado.resources.splice(0, 1)[0]; // pick from top
                justNames.push(nsFile.qualifiedName);
                if (justNames.length === 1) { logger(0, 'resources', ''); }
        
                logger(1, '', nsFile.qualifiedName + ' (./' + nsFile.file + ')'); 
        
                const afterMinify = (content) => {
                    let encodingType = '';
                    if (!content) {
                        if (options.utf8EncodeResourceTypes.indexOf(nsFile.ext) !== -1) {
                            content = fsx.readFileSync(nsFile.file, 'utf8');
                            encodingType = 'utf8;';
                        } else { // no encoding
                            content = fsx.readFileSync(nsFile.file);
                        }
                    } else {
                        encodingType = 'utf8;';
                    }
        
                    // base64 encoding before adding to file
                    content = Buffer.from(content).toString('base64');
                    encodingType += 'base64;';
        
                    // embed resource
                    let rdo = {
                        name: nsFile.qualifiedName,
                        encodingType: encodingType,
                        asmFile: options.current.ado.file,
                        file: './' + nsFile.file,
                        data: content
                    };
        
                    // wrap resource in resource wrapper
                    let thisRes = '';
                    thisRes = replaceAll(asm_res, '<<asm_res>>', JSON.stringify(rdo));
                    thisRes = replaceAll(thisRes, '<<file>>', rdo.file);
        
                    // append content to all list
                    allResources += thisRes + '\n';

                    // pick next
                    injectResources(cb, justNames, allResources);
                };
                const afterLint = () => {
                    // minify/read resource
                    if (options.minifyResources && !options.current.skipMinify && !options.current.skipMinifyThisAssembly) {
                        if (options.minifyTypes.indexOf(nsFile.ext) !== -1) {
                            if (options.minifyTypes.indexOf(nsFile.ext) !== -1) {
                                let p = null;
                                switch (nsFile.ext) {
                                    case 'js': p = minifyJS(nsFile.file); break;
                                    case 'css': p = minifyCSS(nsFile.file); break;
                                    case 'html': p = minifyHTML(nsFile.file); break;
                                }
                                if (p === null) {
                                    afterMinify();
                                } else {
                                    p.then(afterMinify).catch((err) => { throw err; });
                                }
                            } else {
                                afterMinify();
                            }
                        } else {
                            afterMinify();
                        }
                    } else {
                        afterMinify();
                    }
                };
        
                // lint resource
                if (options.lintResources) {
                    lintFile(nsFile.file).then(afterLint).catch((err) => { throw err; });
                } else {
                    afterLint();
                }
            };  
            const flattenRoutes = (cb, justData) => {
                justData = justData || [];
                if (options.current.ado.routes.length === 0) { 
                    options.current.ado.routes = justData;
                    delete options.current.__routes;
                    cb(); return; 
                }

                // define route to process
                let nsRoute = options.current.ado.routes.splice(0, 1)[0]; // pick from top
                if (!options.current.__routes) { logger(0, 'routes', ''); options.current.__routes = true; }
                logger(1, '', './' + nsRoute.file); 
                for(let route of nsRoute.data) {
                    justData.push(route); // add each route - this means, from vary many routes.json files in an assembly, all routes are flattened to one list
                }
        
                flattenRoutes(cb, justData); // pick next
            };                            
            const pack = (cb) => {
                options.current.stat = options.current.asmFileName + ' (' + Math.round(fsx.statSync(options.current.asm).size / 1024) + 'kb';
                
                let minFile = '';
                const afterGzip = () => {
                    options.current.stat += ')';
                    cb();
                };
                const afterMinify = () => {
                    // gzip
                    let gzFile = minFile + '.gz';
                    if (options.gzip && !options.current.skipMinify && !options.current.skipMinifyThisAssembly) {
                        gzipFile(minFile).then(() => {
                            options.current.stat += ', ' + Math.round(fsx.statSync(gzFile).size / 1024) + 'kb gzipped';
                            afterGzip();
                        }).catch((err) => { throw err; });
                    } else { // delete old existing
                        if (!options.fullBuild && fsx.existsSync(gzFile)) { fsx.removeSync(gzFile); }
                        afterGzip();
                    }
                };
                const afterLint = () => {
                    // minify
                    minFile = options.current.asm.replace('.js', '.min.js');
                    if (options.minify && !options.current.skipMinify && !options.current.skipMinifyThisAssembly) {
                        minifyFile(options.current.asm).then(() => {
                            options.current.stat += ', ' + Math.round(fsx.statSync(minFile).size / 1024) + 'kb minified';
                            afterMinify();
                        }).catch((err) => { throw err; });
                    } else { // delete old existing
                        if (!options.fullBuild && fsx.existsSync(minFile)) { fsx.removeSync(minFile); }
                        let mapFile = minFile + '.map';
                        if (!options.fullBuild && fsx.existsSync(mapFile)) { fsx.removeSync(mapFile); }
                        afterMinify();
                    }
                };
        
                // lint
                if (options.lint) {
                    lintFile(options.current.asm).then(afterLint).catch((err) => { throw err; });
                } else {
                    afterLint();
                }
            };      
            const createAssembly = () => {
                fsx.writeFileSync(options.current.asm, options.current.asmContent.trim(), 'utf8');
                options.current.asmContent = '';
            };  

            // define assembly to process
            let asmFolder = options.current.assemblies.splice(0, 1)[0]; // pick from top
            if (asmFolder.startsWith('_')) { processAssemblies(done); return; } // ignore if starts with '_'
    
            // assembly (start)
            logger(0, 'asm', asmFolder, true); 
            options.current.asmName = asmFolder;
            options.current.asmPath = './' + path.join(options.current.src, options.current.asmName);
            options.current.asm = './' + path.join(options.current.dest, options.current.asmName + '.js');
            options.current.asmFileName = ('./' + path.join(options.current.dest, options.current.asmName) + '.js').replace(options.dest, '.');
            if (options.customBuild && options.profiles.current.omitRoot) {
                options.current.asmFileName = options.current.asmFileName.replace(options.profiles.current.root + '/', '');
            }
            options.current.asmMain = './' + path.join(options.current.src, options.current.asmName, 'index.js');
            options.current.functions = './' + path.join(options.current.src, options.current.asmName, 'functions.js');
            options.current.asmSettings = './' + path.join(options.current.src, options.current.asmName, 'settings.json');
            options.current.asmConfig = './' + path.join(options.current.src, options.current.asmName, 'config.json');
            options.current.skipMinifyThisAssembly = (options.skipMinifyFor.indexOf(asmFolder) !== -1); // skip minify for this assembly, if this is a special file
            options.current.asmLupdate = null;
            options.current.asmContent = '';

            // initialize assembly
            if (fsx.existsSync(options.current.asm)) { 
                options.current.asmLupdate = fsx.statSync(options.current.asm).mtime; 
                fsx.removeSync(options.current.asm);
            }
            fsx.ensureFileSync(options.current.asm);            

            // append in ADO
            appendADO();

            // process namespaces under this assembly 
            options.current.namespaces = getFolders(options.current.asmPath, true);
            processNamespaces(() => { 

                // process assets of the assembly
                options.current.ado.assets = collectAssets();
                processAssets(() => {
                    // copy libs over assets (this will overwrite, if there are same name files in assets and libs)
                    copyLibs();
    
                    // copy root files
                    copyRootFiles();
    
                    // initialize assembly content
                    initializeAssemblyContent();
    
                    // inject types
                    injectTypes(() => {

                        // inject resources
                        injectResources(() => {

                            // flatten all collected routes to one list, so they can be sorted when being loaded
                            flattenRoutes(() => {

                                // finalize assembly content
                                finalizeAssemblyContent();

                                // create assembly
                                createAssembly();

                                // lint, minify and gzip assembly
                                pack(() => {
                                    // assembly (end)
                                    logger(0, '==>', options.current.stat); 
                                    processAssemblies(done); // pick next
                                });
                            });
                        });
                    });
                });
            });
        };

        // process sources
        const processSources = (done) => {
            if (options.sources.length === 0) { done(); return; }
    
            // support functions
            const createPreamble = () => {
                if (options.current.adosJSON.length === 0) { return; }
        
                logger(0, 'preamble', options.current.preamble.replace(options.dest, '.'), true);
                
                // create preamble content
                let preambleContent = replaceAll(asm_preamble_file, '<<path>>', options.current.dest.replace(options.dest, './'));
                preambleContent = replaceAll(preambleContent, '<<lupdate>>', new Date().toUTCString());
                preambleContent = replaceAll(preambleContent, '<<package>>', options.packageJSON.name);
                preambleContent = replaceAll(preambleContent, '<<ados>>', JSON.stringify(options.current.adosJSON));

                // write preamble file
                fsx.writeFileSync(options.current.preamble, preambleContent, 'utf8');
            };            

            // define source to process
            let source = options.sources.splice(0, 1)[0]; // pick from top
            if (source.startsWith('_')) { processSources(done); return; } // ignore if starts with '_'
            if (options.customBuild) { source = path.join(options.profiles.current.root, source); }
    
            // source group (start)
            logger(0, 'group', `${source.replace(options.src, '.')} (start)`, true);  
            options.current = {};
            options.current.src = options.customBuild ? ('./' + path.join(options.src, source)) : source;
            options.current.dest = options.current.src.replace(options.src, options.dest);
            if (options.customBuild) {
                options.current.dest = options.current.dest.replace(options.dest , options.profiles.current.dest); 
                options.current.dest = options.current.dest.replace(options.profiles.current.root + '/', '');
            }
            options.current.adosJSON = [];
            options.current.preamble = './' + path.join(options.current.dest, 'preamble.js');
            options.current.skipMinify = options.customBuild ? options.profiles.current.skipMinify : false;
    
            // process assemblies under this group
            options.current.assemblies = getFolders(options.current.src, true);
            processAssemblies(() => {
                // create group preamble
                createPreamble();
    
                // source group (end)
                logger(0, 'group', `${source.replace(options.src, '.')} (end)`, true);  
                options.current = {};

                // process next source group
                processSources(done);
            });
        };

        // process profiles
        const processProfiles = (done) => {
            if (options.profiles.length === 0) { done(); return; } // when all done
    
            // support functions
            const getProfileTarget = (profileName) => {
                let theProfile = options.customBuildConfig.profiles[profileName],
                    target = '';
                if (theProfile.dest && theProfile.dest !== '') {
                    if (theProfile.dest === '/') { 
                        target = options.dest;
                    } else if (theProfile.dest.startsWith('@')) { // move
                        target = theProfile.dest.substr(1); // remove @
                        target = getProfileTarget(target);
                        target = path.join(target, theProfile.root);
                    } else {
                        target = path.join(options.dest, theProfile.dest);
                    }
                } else {
                    target = './' + path.join(options.dest, theProfile.root); 
                }
                return target;
            };
            const runPlugins = (cb) => {
                if (!options.customBuild) { cb(); return; }
        
                // expose functions for plugins
                options.funcs = {
                    minifyFile: minifyFile,
                    lintFile: lintFile,
                    gzipFile: gzipFile
                };
        
                const onDone = () => {
                    delete options.funcs;
                    cb();
                };
        
                let allPlugins = options.profiles.current.plugins ? options.profiles.current.plugins.slice() : [];
                const runPlugin = () => {
                    if (allPlugins.length === 0) { onDone(); return; }
                    
                    let plugin_name = allPlugins.shift(),
                        plugin_exec = null;
        
                    if (options.plugins[plugin_name]) { 
                        plugin_exec = options.plugins[plugin_name].exec; 
                        if (plugin_exec) {
                            plugin_exec(options.plugins[plugin_name].settings, options, runPlugin);
                        }
                    }
                };
        
                // start
                runPlugin();
            };              

            // define profile to process
            let profileItem = options.profiles.splice(0, 1)[0]; // pick from top
            options.profiles.current = Object.assign({}, options.customBuildConfig.profiles[profileItem.profile]); // use a copy
            options.profiles.current.dest = getProfileTarget(profileItem.profile);
            
            // define source folders to process
            let srcList = [].concat(...options.profiles.current.build);
            options.sources = srcList;

            // profile (start)
            logger(0, 'profile', `${profileItem.profile} (start)`, true);  
            
            // process sources
            processSources(() => {

                // run plugins on processed profile files at destination
                runPlugins(() => {
                    
                    // profile (end)
                    logger(0, 'profile', `${profileItem.profile} (end)`, true); 
                    options.profiles.current = null;

                    // process next profile
                    processProfiles(done);
                });
            });
        };
    
        // build process
        const startBuild = (done) => {
            // support functions
            const getPlugins = () => {
                let plugins = {};
                for(let p of options.customBuildConfig.plugins) {
                    plugins[p.name] = {
                        name: p.name,
                        settings: Object.assign({}, p.settings),
                        file: p.file,
                        exec: null
                    };
                    if (path.basename(p.file) === p.file) { // no path given, means it is an inbuilt plugin
                        p.file = path.join(options.engine.replace('.js', '/plugins'),  p.file);
                    }
                    if (p.file) {
                        plugins[p.name].file = p.file;
                        plugins[p.name].exec = require(p.file).exec;
                    }
                }
                return plugins;
            };

            if (options.customBuild) { // custom build
                // define plugins
                options.plugins = getPlugins();
        
                // define profiles to process
                options.profiles = options.customBuildConfig.build.slice();
                options.profiles.current = null;

                // process profiles
                processProfiles(() => {
                    done();
                });
            } else { // default build
                // define source folders to process
                let srcList = [];
                srcList.push(options.src); // source itself is the folder
                options.sources = srcList;
                
                // process sources
                processSources(() => {
                    done();
                });
            }
        };

        // start
        startBuild(buildDone);
    };

    // engine wrapper
    /**
     * @name flairBuild
     * @description Builds flair assemblies as per given configuration
     * @example
     *  flairBuild(options, cb)
     * @params
     *  options: object - build configuration object having following options:
     *              src: source folder root path
     *              dest: destination folder root path - where to copy built assemblies
     *              customBuild: if custom control is needed for picking source and other files
     *                  true - all root level folders under 'src' will be treated as one individual assembly
     *                      Note: if folder name starts with '_', it is skipped
     *                  false - customization can be done using a config
     *              customBuildConfig: custom folders configuration options file path, having structure
     *              {
     *                  "build": [
     *                      {
     *                          "profile": - name of the profile to build
     *                          "dest": - relative path at destination folder where to copy distribution files of this profile
     *                                    "" - empty (or absence of this) means copy at destination root in same name folder as root of the profile
     *                                    "@profileName" - means copy at destination root under output of this given profile
     *                                    "somepath/thispath" - means output folder of this profile will be moved as this path with a rename of "thispath"
     *                      }
     *                  ],
     *                  "profiles": {
     *                      "<profileName>": {
     *                          "root": ""  - root folder name where source of this profile is kept - this is used for identification of content under dest folder only - not used for any prefixing with other paths in profile
     *                          "dest": "" - dest folder name where built/processed files are anchored under dest folder
     *                                      it can be:
     *                                          (empty) or absence of this, means, put it in same root folder name under dest
     *                                          / - to represents files to be placed directly under dest folder
     *                                          @<profileName> - to place files in same root folder name under dest folder of given profileName
     *                          "skipMinify": true/false 
     *                                      if true, minification for assemblies under this profile will be skipped, this is useful for server side assemblies
     *                          "omitRoot": true/false
     *                                      if true, it will replace root folder name with "" when building assembly file path and name for preamble
     *                                      this is generally set to true for client installation, if client files are being served from inside server files
     *                          "modules": [ ] - copy all specified "node_modules" to a root "modules" folder as is, - to handle some modules at client-side
     *                                           NOTE: unlike broserify, it does not check dependencies, therefore only those modules which work independently, are suited for this
     *                          "copy": [ ] - having path (relative to src path) to copy as is on dest folder
     *                          "minify": [ ] - having path (relative to src path) of files which need to be minified (at same place, same name .min.ext file will be created)
     *                          "build": [ ] - having path (relative to src path) to treat as assembly folder group
     *                                      all root level folders under each of these will be treated as one individual assembly
     *                                      Note: if folder name (of assembly folder under it) starts with '_', it is skipped
     *                      }
     *                  }
     *              }
     *              mainAssembly: string - name of the mainAssembly, whose load location will be dynamically used as reference to load other assemblies
     *                            This is ignored in custom build where paths are statically resolved at build time
     *              fullBuild: true/false   - is full build to be done
     *              skipBumpVersion: true/false - if skip bump version with build
     *              suppressLogging: true/false  - if build time log is to be shown on terminal
     *              lint: true/false - if lint operation is to be executed
     *              lintConfig: lint configuration options file path, having structure
     *              {
     *                  "js": { NOTE: Option configuration comes from: https://eslint.org/docs/user-guide/configuring AND https://eslint.org/docs/developer-guide/nodejs-api#cliengine
     *                  },
     *                  "css": { NOTE: Option configuration comes from: https://github.com/stylelint/stylelint/blob/0e378a7d31dcda0932f20ebfe61ff919ed1ddc42/docs/user-guide/configuration.md
     *                  },
     *                  "html": { NOTE: Option configuration comes from: https://www.npmjs.com/package/htmllint AND https://github.com/htmllint/htmllint/wiki/Options
     *                  }
     *              }
     *              lintTypes: - what all types to run linting on - ["js", "css", "html"]
     *              minify: true/false   - is minify to be run
     *              minifyConfig - minify configuration options file path having structure
     *              {
     *                  "js": { NOTE: Option configuration comes from: https://github.com/mishoo/UglifyJS2/tree/harmony
     *                  },
     *                  "css": { NOTE: Option configuration comes from: https://www.npmjs.com/package/clean-css
     *                  },
     *                  "html": { NOTE: Option configuration comes from: https://www.npmjs.com/package/html-minifier
     *                  }
     *              }
     *              minifyTypes: - what all types to run minification on - ["js", "css", "html"]
     *              generateJSSourceMap: true/false - if source map to be generated for js files
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
     *                                exclude: {
     *                                      patterns: [] - file or folder name patterns, either full name or if ends with a *, checks start with, or if start with a *, checks for endsWith possibilities
     *                                      maps: - true/false - to exclude *.map files
     *                                      un-min: - true/false - to exclude *.js file, if a *.min.js exists for same file, that means only *.min.js will be copied, and not *.js of this file
     *                                }
     *                  post: [] - each item in here should have structure as: { src, dest }
     *                            NOTE:
     *                                src:  local file path (generally the built files)
     *                                dest: local file path (generally copied to some other local folder)
     *                                exclude: {
     *                                      patterns: [] - file or folder name patterns, either full name or if ends with a *, checks start with, or if start with a *, checks for endsWith possibilities
     *                                      maps: - true/false - to exclude *.map files
     *                                      un-min: - true/false - to exclude *.js file, if a *.min.js exists for same file, that means only *.min.js will be copied, and not *.js of this file
     *                                }
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
     *                                       which are placed on root of the assembly namespace - i.e., assembly name itself is used as namespace
     *                                       (except in case of flair - where namespace is omitted altogether) 
     *                          (assets)   - assets folder
     *                                  > this special folder can be used to place all external assets like images, css, js, fonts, etc.
     *                                  > it can have any structure underneath
     *                                  > all files and folder under it, are copied to destination under <assemnly folder> folder
     *                                  > which means, if an assembly has assets, in destination folder, it will look like:
     *                                      <assembly folder>.js        - the assembly file
     *                                      <assembly folder>.min.js    - the assembly file (minified)
     *                                      <assembly folder>/          - the assembly's assets folder content here under (this is created only if assets are defined)
     *                                  > note, '(assets)' folder itself is not copied, but all contents underneath are copied
     *                          (..)     - dest root folder
     *                                  > this special folder is used to put files at the root where assembly itself is being copied
     *                                  > this means, files from multiple assemblies can be placed at root and merged in same folder - may overwrite as well, (it will warn)
     *                          (libs)   - libs folder
     *                                  > this special folder can be used to place all external third-party libraries, etc.
     *                                  > it can have any structure underneath
     *                                  > all files and folder under it, are copied to destination under <assemnly folder> folder
     *                                    it copies over content of (assets) folder, so overwrite may happen, it will warn.
     *                                  > no processing of files happen whatsoever, files are copied as is
     *                                  > note, '(libs)' folder itself is not copied, but all contents underneath are copied
     *                          (bundle)   - bundled files' folder
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
     * @returns void
     */ 
    const flairBuild = function(options, cb) {
        // build options
        options = options || {};
        options.engine = options.engine || '';
        options.package = options.package || './package.json';

        options.dest = options.dest || './dist';
        options.src = options.src || './src';
    
        options.customBuild = options.customBuild || false; 
        options.customBuildConfig = options.customBuildConfig || '';

        options.mainAssembly = options.customBuild ? '' : (options.mainAssembly || '');
        
        options.fullBuild = options.fullBuild || false;
        options.quickBuild = (!options.fullBuild && options.quickBuild) || false;
        options.clean = options.clean !== undefined ? options.clean : true;
        options.skipBumpVersion = options.skipBumpVersion || false;
        options.suppressLogging = options.suppressLogging || false;

        options.lint = options.lint !== undefined ? options.lint : true;
        options.lintConfig = options.lintConfig || '';
        options.lintTypes = options.lintTypes || ["js", "css", "html"];

        options.minify = options.minify !== undefined ? options.minify : true;
        options.minifyConfig = options.minifyConfig || '';
        options.minifyTypes = options.minifyTypes || ["js", "css", "html"];
        options.generateJSSourceMap = options.generateJSSourceMap !== undefined ? options.generateJSSourceMap : false;

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

        // full-build vs quick build vs default build settings
        if (options.fullBuild) { // full build - ensure these things happen, if configured, even if turned off otherwise
            options.clean = true;
            options.lint = options.lintConfig ? true : false;
            options.minify = options.minifyConfig ? true : false;
            options.gzip = options.gzipConfig ? true : false;
            options.preBuildDeps = options.depsConfig ? true : false;
            options.postBuildDeps = options.depsConfig ? true : false;
            options.lintResources = options.lint && options.lintResources;
            options.minifyResources = options.minify && options.minifyResources;
            options.minifyAssets = options.minify && options.minifyAssets;
            options.gzipAssets = options.gzip && options.gzipAssets;
        } else if (options.quickBuild) { // quick build - suppress few things
            options.clean = false;
            options.lintResources = options.lint && options.lintResources;
            options.lintTypes = ['js']; // for quick builds run lint only for JS files
            options.minify = false;
            options.gzip = false;
            options.minifyAssets = false;
            options.gzipAssets = false;
            options.minifyResources = false;
            options.preBuildDeps = false;
            options.skipBumpVersion = true;
        } // else whatever is set in build file

        // exclude files from being registered
        options.skipRegistrationsFor = [
            'flair',
            'flair.cli'
        ];
        // exclude files from being added to preamble
        options.skipPreambleFor = [
            'flair',
            'flair.cli'
        ];  
        // exclude files from being added to minified
        options.skipMinifyFor = [
            'flair.cli'
        ];        

        // process options with their resolved values
        options.packageJSON = fsx.readJSONSync(path.resolve(options.package));
        options.lintConfig = options.lintConfig ? fsx.readJSONSync(path.resolve(options.lintConfig)) : null;
        options.minifyConfig = options.minifyConfig ? fsx.readJSONSync(path.resolve(options.minifyConfig)) : null;
        options.gzipConfig = options.gzipConfig ? fsx.readJSONSync(path.resolve(options.gzipConfig)) : null;
        options.depsConfig = options.depsConfig ? fsx.readJSONSync(path.resolve(options.depsConfig)) : null;
        options.customBuildConfig = options.customBuildConfig ? fsx.readJSONSync(path.resolve(options.customBuildConfig)) : null;

        // lint
        if (options.lint && options.lintConfig) {
            if (options.lintTypes.indexOf('js') !== -1) { // JS lint
                const CLIEngine = new require('eslint').CLIEngine            
                options.lintJS = new CLIEngine(options.lintConfig.js);
                options.eslintFormatter = options.lintJS.getFormatter();
            }
            if (options.lintTypes.indexOf('css') !== -1) { // CSS lint
                options.lintCSS = require('stylelint').lint;
            }
            if (options.lintTypes.indexOf('html') !== -1) { // HTML lint
                options.lintHTML = require('htmllint');
            }
        }

        // minify
        if (options.minify && options.minifyConfig) {
            if (options.minifyTypes.indexOf('js') !== -1) { // JS minifier
                options.minifyJS = require('uglify-es').minify;
            }
            if (options.minifyTypes.indexOf('css') !== -1) { // CSS minifier
                options.minifyCSS = require('clean-css');
            }
            if (options.minifyTypes.indexOf('html') !== -1) { // HTML minifier
                options.minifyHTML = require('html-minifier').minify;
            }        
        }

        // gzip
        if (options.gzip && options.gzipConfig) {
            options.zlib = require('zlib');
        }    

        // logger
        const logger = (level, msg, data, prlf, polf) => {
            if (options.suppressLogging) { return; }
            
            prlf=false; polf=false; // no lf is much cleaner - so turn off all pre/post lf settings
            
            let colLength = 15;
            msg = ' '.repeat(colLength - msg.length) + msg + (level === 0 ? ': ' : '');
            if (level !== 0) { data = '- ' + data; }
            msg = msg + '  '.repeat(level) + data.toString();
            if (prlf) { msg = '\n' + msg; }
            if (polf) { msg += '\n'; }
            console.log(msg);   // eslint-disable-line no-console
        }; 
        options.logger = logger;

        // start
        logger(0, 'flairBuild', 'start ' + (options.fullBuild ? '(full)' : (options.quickBuild ? '(quick)' : '(default)')), true);

        // delete all dest files
        if (options.clean) {
            delAll(options.dest);
            logger(0, 'clean', 'done');
        }

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
    
    // return
    return flairBuild;
});