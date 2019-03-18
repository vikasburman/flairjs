/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.cli
 *     File: ./flair.cli.js
 *  Version: 0.25.76
 *  Mon, 18 Mar 2019 22:05:00 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * Licensed under MIT
 */
 // members
/**
 * @name flair Build
 * @description Build engine
 */
const rrd = require('recursive-readdir-sync'); 
const copyDir = require('copy-dir');
const path = require('path');
const fsx = require('fs-extra');
const del = require('del');
const buildInfo = {
    name: 'flair.cli',
    version: '0.25.76',
    format: 'fasm',
    formatVersion: '1',
    contains: [
        'initializer',      // index.js is built
        'types',            // types are embedded
        'enclosureVars',    // flair variables are made available in a closure where types are bundled
        'enclosedTypes',    // types are places in a closure
        'resources',        // resources are bundled
        'assets',           // assets are processed and their names are added in ado
        'routes',           // routes are collected, and added in ado
        'selfreg'           // selfreg code is bundled
    ]
};

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
process.on('unhandledRejection', (reason) => { // to handle special scenarios
    console.log(reason); // eslint-disable-line no-console
});

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
const build = (options, buildDone) => {
    const logger = options.logger;
    const appendToFile = (text, isAppend = true) => {
        if (isAppend) {
            fsx.writeFileSync(options.current.asm, text, {flag: 'a'});
        } else {
            fsx.writeFileSync(options.current.asm, text);
        }
    };  
    const resolveRoot = (buildPath) => {
        let resolvedRoot = 'error/define/resolveRoot/for/' + buildPath;
        for(let partialBuildPath in options.profiles.current.resolveRoot) {
            if (options.profiles.current.resolveRoot.hasOwnProperty(partialBuildPath)) {
                if (buildPath.startsWith(partialBuildPath)) {
                    resolvedRoot = buildPath.replace(options.profiles.current.resolveRoot[partialBuildPath], './');
                    break;
                }
            }
        }
        return resolvedRoot;
    };
    const resolvePreamble = (buildPath) => {
        let preambleRoot = buildPath;
        for(let partialBuildPath in options.profiles.current.preambleRoot) {
            if (options.profiles.current.preambleRoot.hasOwnProperty(partialBuildPath)) {
                if (buildPath.startsWith(partialBuildPath)) {
                    preambleRoot = options.profiles.current.preambleRoot[partialBuildPath];
                    break;
                }
            }
        }
        return path.join(options.dest, preambleRoot);
    };
    const resolveSkipMinify = (buildPath) => {
        let skip = false;
        for(let partialBuildPath of options.profiles.current.skipMinifyRoot) {
            if (buildPath.startsWith(partialBuildPath)) {
                skip = true;
                break;
            }
        }
        return skip;
    };
    const copyCustom = (done) => {
        if (!options.customBuild) { done(); return; }
        if (options.profiles.current.copy.length === 0) { done(); return; }
    
        // copy all files or folders as is in dest
        options.logger(0, 'copy', '', true);    
            let src = '',
                dest = '';
        for(let fileOrFolder of options.profiles.current.copy) {
            src = path.resolve(path.join(options.src, fileOrFolder));
            dest = path.resolve(path.join(options.dest, fileOrFolder))
            options.logger(1, '', './' + path.join(options.src, fileOrFolder));
            if (fsx.lstatSync(src).isDirectory()) {
                fsx.ensureDirSync(dest);
                copyDir.sync(src, dest);
            } else {
                fsx.ensureDirSync(path.dirname(dest));
                fsx.copyFileSync(src, dest);
            }        
        }
    
        // done
        done();
    };    
    const copyModules = (done) => {
        if (!options.customBuild) { done(); return; }
        if (options.profiles.current.modules.length === 0) { done(); return; }

        // copy all defined modules from node_modules to destination's "modules" folder at root
        options.logger(0, 'modules', '', true);    
            let src = '',
                dest = '';
        for(let module of options.profiles.current.modules) {
            src = path.resolve(path.join('node_modules', module));
            dest = path.resolve(path.join(options.dest, options.profiles.current.root, 'modules', module));
            options.logger(1, '', module);
            fsx.ensureDirSync(dest);
            copyDir.sync(src, dest);
        }
    
        // done
        done();
    };    

    const appendHeader = () => {
        let header = 
        `/**\n`+
        ` * @preserve\n` +
        ` * ${options.packageJSON.title}\n` +
        ` * ${options.packageJSON.description}\n` +
        ` * \n` +
        ` * Assembly: ${options.current.asmName}\n` +
        ` *     File: ${options.current.asmFileName}\n` +
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

            // replace ado specific information in this content
            for(let prop in options.current.ado) {
                if (options.current.ado.hasOwnProperty(prop)) {
                    if (typeof options.current.ado[prop] === 'string') { // only string values of ado are looked at
                        content = content.replace(`<<${prop}>>`, options.current.ado[prop]);
                    }
                }
            }
            
            appendToFile(content); 
            logger(0, 'index', options.current.asmMain); 
        }
    };
    const initAsm = () => {
        if (fsx.existsSync(options.current.asm)) { 
            options.current.asmLupdate = fsx.statSync(options.current.asm).mtime; 
            fsx.removeSync(options.current.asm);
        }
        fsx.ensureFileSync(options.current.asm);
    };
    const appendADO = () => {
        // each ADO object has:
        //      "name": "", 
        //      "file": "",
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
        //      "routes": ["", "", ...]
        options.current.ado = {
            name: options.current.asmName,
            file: options.current.asmFileName.replace('.js', '{.min}.js'),
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

        if (options.skipRegistrationsFor.indexOf(options.current.asmName) === -1) { // if not to be skipped for preamble
            options.current.adosJSON.push(options.current.ado);
        }
    };

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

    const processAssets = (done, justNames1) => {
        justNames1 = justNames1 || [];
        if (options.current.ado.assets.length === 0) { 
            options.current.ado.assets = justNames1;
            done(); return; 
        }
        let astFile = options.current.ado.assets.splice(0, 1)[0]; // pick from top
        justNames1.push(astFile.dest.replace(options.current.dest, '.'));

        // process only if full build OR asset is changed
        if (!options.fullBuild && fsx.existsSync(astFile.dest)) {
            let srcLupdate = fsx.statSync(astFile.src).mtime.toString(),
                destLupdate = fsx.statSync(astFile.dest).mtime.toString();
            if (srcLupdate === destLupdate) { processAssets(done, justNames1); return; }
        }
        if (!options.current.isAssetsHeadingPrinted) { logger(0, 'assets', ''); options.current.isAssetsHeadingPrinted = true; }

        fsx.ensureDirSync(path.dirname(astFile.dest)); // ensure dest folder exists
        fsx.copyFileSync(astFile.src, astFile.dest);
        astFile.stat = astFile.dest.replace(options.current.dest, '.') + 
        ' (' + Math.round(fsx.statSync(astFile.dest).size / 1024) + 'kb';

        let minFile = '';
        const afterGzip = () => {
            astFile.stat += ')';

            logger(1, '', astFile.stat);
            delete astFile.stat;

            processAssets(done, justNames1); // pick next
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
    const startClosure = () => {
        if (options.skipRegistrationsFor.indexOf(options.current.asmName) !== -1) { return; } // skip for special cases

        // append closure header
        let closureHeader = 
        `(() => {\n` + 
        `'use strict';\n\n` +
        `/* eslint-disable no-unused-vars */\n` +
        `const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));\n` +
        `const { Class, Struct, Enum, Interface, Mixin } = flair;\n` +
        `const { Aspects } = flair;\n` +
        `const { AppDomain } = flair;\n` +
        `const __currentContextName = flair.AppDomain.context.current().name;\n` +
        `const { $$, attr } = flair;\n` +
        `const { bring, Container, include } = flair;\n` +
        `const { Port } = flair;\n` +
        `const { on, post, telemetry } = flair;\n` +
        `const { Reflector } = flair;\n` +
        `const { Serializer } = flair;\n` +
        `const { Tasks } = flair;\n` +
        `const { TaskInfo } = flair.Tasks;\n` +
        `const { as, is, isComplies, isDerivedFrom, isImplements, isInstanceOf, isMixed } = flair;\n` +
        `const { getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf, typeOf } = flair;\n` +
        `const { dispose, using } = flair;\n` +
        `const { Args, Exception, noop, nip, nim, nie, event } = flair;\n` +
        `const { env } = flair.options;\n` +
        `const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, isArrowFunc, isASyncFunc, sieve, b64EncodeUnicode, b64DecodeUnicode } = flair.utils;\n` +
        `const { $static, $abstract, $virtual, $override, $sealed, $private, $privateSet, $protected, $protectedSet, $readonly, $async } = $$;\n` +
        `const { $enumerate, $dispose, $post, $on, $timer, $type, $args, $inject, $resource, $asset, $singleton, $serialize, $deprecate, $session, $state, $conditional, $noserialize, $ns } = $$;\n` +
        `/* eslint-enable no-unused-vars */\n` +
        `\n`; 
        appendToFile(closureHeader);        
    };
    const endClosure = () => {
        if (options.skipRegistrationsFor.indexOf(options.current.asmName) !== -1) { return; } // skip for special cases

        // append closure footer
        let closureFooter = 
        `\n` + 
        `})();\n`;
        appendToFile(closureFooter);
    };
    const appendSettings = () => {
        if (options.skipRegistrationsFor.indexOf(options.current.asmName) !== -1) { return; } // skip for special cases

        let settings = '',
            settingsContent = '';
        if (fsx.existsSync(options.current.asmSettings)) {
            settings = JSON.stringify(fsx.readJSONSync(options.current.asmSettings));
            logger(0, 'settings',  options.current.asmSettings);
        }
        // settings is a closure variable of each assembly separately
        if (settings) { 
            settingsContent = `let settings = JSON.parse('${settings}'); // eslint-disable-line no-unused-vars\n`;
        } else {
            settingsContent = `let settings = {}; // eslint-disable-line no-unused-vars\n`;
        }
        // settings can be defined outside as well, new also
        // default values given in these settings will be overwritten by what is defined in external config file
        settingsContent += `
        let settingsReader = flair.Port('settingsReader');
        if (typeof settingsReader === 'function') {
            let externalSettings = settingsReader('${options.current.asmName}');
            if (externalSettings) { settings = Object.assign(settings, externalSettings); }
        }
        settings = Object.freeze(settings);
        `;
        appendToFile(settingsContent);
    };
    const appendTypes = (done) => {
        if (options.current.ado.types.length === 0) { done(); return; }

        logger(0, 'types', '');

        // activate current file name
        let dump = `flair.AppDomain.context.current().currentAssemblyBeingLoaded('${options.current.ado.file}');\n`;
        appendToFile(dump);

        // append types
        let justNames = [],
            thisFile = '';
        for(let nsFile of options.current.ado.types) {
            justNames.push(nsFile.qualifiedName);
            thisFile = './' + nsFile.originalFile;
            logger(1, '', nsFile.qualifiedName + ' (' + thisFile + ')'); 

            // read file
            let content = fsx.readFileSync(nsFile.originalFile, 'utf8');

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

            // wrap type in its own closure, so it's own constants etc defind on top of file
            // does not conflict with some other type's constants
            content = `\n(async () => { // ${thisFile}\n'use strict';\n${content}\n})();\n`;

            // append content to file
            appendToFile(content);
        }
        options.current.ado.types = justNames; // update types list

        // deactivate current file name
        dump = `\nflair.AppDomain.context.current().currentAssemblyBeingLoaded('');\n`;
        appendToFile(dump);

        // done
        done();
    };
    const appendResources = (done, justNames2) => {
        justNames2 = justNames2 || [];
        if (options.current.ado.resources.length === 0) { 
            options.current.ado.resources = justNames2;
            done(); return; 
        }
        let nsFile = options.current.ado.resources.splice(0, 1)[0]; // pick from top
        justNames2.push(nsFile.qualifiedName);
        if (justNames2.length === 1) { logger(0, 'resources', ''); }

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

            // eslint-disable-next-line no-useless-escape
            let dump = `\n(() => { \/\/ ${rdo.file}\n\tlet rdo = JSON.parse('${JSON.stringify(rdo)}'); \n\tflair.AppDomain.context.current().registerResource(rdo);}\n)();\n`;
            appendToFile(dump);

            appendResources(done, justNames2); // pick next
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
    const appendRoutes = (done, justNames3) => {
        justNames3 = justNames3 || [];
        if (options.current.ado.routes.length === 0) { 
            options.current.ado.routes = justNames3;
            delete options.current.__routes;
            done(); return; 
        }
        let nsRoute = options.current.ado.routes.splice(0, 1)[0]; // pick from top
        if (!options.current.__routes) { logger(0, 'routes', ''); options.current.__routes = true; }
        for(let route of nsRoute.data) {
            justNames3.push(route.name); // add name of each route
        }

        logger(1, '', './' + nsRoute.file); 
        // eslint-disable-next-line no-useless-escape
        let dump = `\n(() => { \/\/ ${nsRoute.file}\n\tlet routes = JSON.parse('${JSON.stringify(nsRoute.data)}'); \n\tflair.AppDomain.context.current().registerRoutes(...routes);}\n)();\n`;
        appendToFile(dump);

        appendRoutes(done, justNames3); // pick next
    };
    const appendSelfRegistration = () => {
        if (options.skipRegistrationsFor.indexOf(options.current.asmName) !== -1) { return; } // skip for special cases

        logger(0, 'self-reg', 'yes'); 
        let dump = `\nflair.AppDomain.registerAdo('${JSON.stringify(options.current.ado)}');\n`;
        appendToFile(dump);
    };
    const pack = (done) => {
        options.current.stat = options.current.asmFileName + ' (' + Math.round(fsx.statSync(options.current.asm).size / 1024) + 'kb';
        
        let minFile = '';
        const afterGzip = () => {
            options.current.stat += ')';
            done();
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
    const createPreamble = () => {
        if (options.current.adosJSON.length === 0) { return; }

        logger(0, 'preamble', options.current.preamble.replace(options.dest, '.'), true);
        let ados = JSON.stringify(options.current.adosJSON);
        let dump = `(() => { let ados = JSON.parse('${ados}');flair.AppDomain.registerAdo(ados);})();\n`;
        fsx.writeFileSync(options.current.preamble, dump, {flag: 'a'}); // append if already exists
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
            
            if (file === 'routes.json') { // routes definition
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
                nsFile.qualifiedName = (options.current.nsName !== '(root)' ? options.current.nsName + '.' : '')  + nsFile.typeName;
                if (nsFile.type === 'res') {
                    options.current.ado.resources.push(nsFile);
                } else {
                    options.current.ado.types.push(nsFile);
                }
            } else {
                let allRoutes = fsx.readJSONSync(nsFile.file, 'utf8');
                let routes = [];
                for(let route of allRoutes) { // add each route separately
                    if (route.name.indexOf('.') !== -1) { throw `Route name cannot contain dots. (${route.name})`; }
                    if (!route.path) { throw `Route path must be defined. (${route.name}`; }
                    if (!route.handler) { throw `Route handler must be defined. (${route.name}`; }
                    route.qualifiedName = (options.current.nsName !== '(root)' ? options.current.nsName + '.' : '')  + route.name;
                    routes.push({ 
                        name: route.qualifiedName,
                        asmFile: options.current.ado.file,
                        mount: route.mount || 'main', // by default all routes mount to main
                        index: route.index || 0, // no index means all are at same level
                        verb: route.verb || '', // verb, e.g., view / get / post, etc.
                        flags: route.flags || [], // any optional flags for some custom logic
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
    const collectAssets = () => {
        options.current.astSrc = './' + path.join(options.current.asmPath, '(assets)');
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
    };
    const copyLibs = () => {
        options.current.libsSrc = './' + path.join(options.current.asmPath, '(libs)');
        options.current.libsDest = './' + path.join(options.current.dest, options.current.asmName);
        if (fsx.existsSync(options.current.libsSrc)) {
            logger(0, 'libs', options.current.libsSrc); 
            let libs = rrd(options.current.libsSrc);
            for (let lib of libs) {
                if (lib.indexOf('/_') !== -1) { continue; } // either a folder or file name starts with '_'. skip it
                let libFile = {
                    ext: path.extname(lib).toLowerCase().substr(1),
                    src: './' + lib,
                    dest: './' + path.join(options.current.libsDest, lib.replace(options.current.libsSrc.replace('./', ''), ''))
                };
                fsx.copySync(libFile.src, libFile.dest, { errorOnExist: true })
            }
        }
        delete options.current.libsSrc;
        delete options.current.libsDest;
    };    
  
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
        let nsFolder = options.current.namespaces.splice(0, 1)[0]; // pick from top
        if (nsFolder.startsWith('_')) { processNamespaces(done); return; } // ignore if starts with '_'
        if (['(assets)', '(libs)', '(bundle)'].indexOf(nsFolder) !== -1) { processNamespaces(done); return; } // skip special folders at namespace level

        options.current.nsName = nsFolder;
        options.current.nsPath = './' + path.join(options.current.asmPath, options.current.nsName);

        // collect types and resources and routes
        collectTypesAndResourcesAndRoutes();

        // pick next
        processNamespaces(done); 
    };
    const processAssemblies = (done) => {
        if (options.current.assemblies.length === 0) { 
            done(); return; 
        }
        let asmFolder = options.current.assemblies.splice(0, 1)[0]; // pick from top
        if (asmFolder.startsWith('_')) { processAssemblies(done); return; } // ignore if starts with '_'

        // start assembly
        logger(0, 'asm', asmFolder, true); 

        options.current.asmName = asmFolder;
        options.current.asmPath = './' + path.join(options.current.src, options.current.asmName);
        options.current.asm = './' + path.join(options.current.dest, options.current.asmName + '.js');
        options.current.asmFileName = './' + path.join(options.current.resolvedRoot, options.current.asmName) + '.js';
        options.current.asmMain = './' + path.join(options.current.src, options.current.asmName, 'index.js');
        options.current.asmSettings = './' + path.join(options.current.src, options.current.asmName, 'settings.json');

        // skip minify for this assembly, if this is a special file
        options.current.skipMinifyThisAssembly = (options.skipRegistrationsFor.indexOf(asmFolder) !== -1);

        // initialize
        initAsm();
        appendADO();
        appendHeader();
        appendMain(); // (index.js)

        // process all namespaces under this assembly to 
        let nsFolders = getFolders(options.current.asmPath, true);
        options.current.namespaces = nsFolders;
        processNamespaces(() => { 
            // collect all assets
            collectAssets();

            // process assets
            processAssets(() => {
                // copy libs over assets
                copyLibs();

                // start assembly content closure
                startClosure();

                // append settings
                appendSettings();

                // append types, resources and self-registration
                appendTypes(() => {
                    appendResources(() => {
                        appendRoutes(() => {
                            appendSelfRegistration();

                            // end assembly content closure
                            endClosure();
    
                            // lint, minify and gzip assembly
                            pack(() => {
                                logger(0, '==>', options.current.stat); 
            
                                processAssemblies(done); // pick next
                            });
                        });
                    });
                });
            });
        });
    };
    const processSources = (done) => {
        if (options.sources.length === 0) { done(); return; }

        // pick source
        let source = options.sources.splice(0, 1)[0]; // pick from top
        if (source.startsWith('_')) { processSources(done); return; } // ignore if starts with '_'

        // start group
        logger(0, 'group', `${source.replace(options.src, '.')} (start)`, true);  
        options.current = {};
        options.current.src = options.customBuild ? ('./' + path.join(options.src, source)) : source;
        options.current.dest = options.current.src.replace(options.src, options.dest);
        options.current.resolvedRoot = options.customBuild ? resolveRoot(source) : '.';
        options.current.adosJSON = [];
        options.current.preamble = './' + path.join((options.customBuild ? resolvePreamble(source) : options.current.dest), 'preamble.js');
        options.current.skipMinify = options.customBuild ? resolveSkipMinify(source) : false;

        // process all assemblies under this group
        let folders = getFolders(options.current.src, true);
        options.current.assemblies = folders;
        processAssemblies(() => {
            // create group preamble
            createPreamble();

            // done
            logger(0, 'group', `${source.replace(options.src, '.')} (end)`, true);  
            options.current = {};
            processSources(done);
        });
    };
    const processProfiles = (done) => {
        if (options.profiles.length === 0) { done(); return; } // when all done

        // pick profile
        let profileItem = options.profiles.splice(0, 1)[0]; // pick from top
        options.profiles.current = options.customBuildConfig.profiles[profileItem.profile];
        let srcList = [].concat(...options.profiles.current.build);
        options.sources = srcList;
        // start profile
        logger(0, 'profile', `${profileItem.profile} (start)`, true);  
        processSources(() => {
            copyCustom(() => {
                copyModules(() => {
                    // done
                    logger(0, 'profile', `${profileItem.profile} (end)`, true); 
                    options.profiles.current = null;
                    processProfiles(done);
                });
            });
        });
    };
    const organizeProfiles = () => {
        let source = '',
            target = '';
        for (let buildProfile of options.customBuildConfig.build) {
            source = path.join(options.dest, options.customBuildConfig.profiles[buildProfile.profile].root);
            if (buildProfile.dest && buildProfile.dest !== '' && buildProfile.dest !== '/') {
                if (buildProfile.dest.startsWith('@')) { // move 
                    target = buildProfile.dest.substr(1); // remove @
                    target = options.customBuildConfig.profiles[target].root; // pick root path of given profile name in dest
                    target = path.join(target, options.customBuildConfig.profiles[buildProfile.profile].root);
                } else {
                    target = buildProfile.dest; // fixed target path
                }
                target = path.join(options.dest, target); // fixed target path

                // move
                if (!source.endsWith('/')) { source += '/'; }
                if (!target.endsWith('/')) { target += '/'; }
                fsx.ensureDirSync(target);
                fsx.moveSync(source, target, { overwrite: true });
            }
        }
    };

    // process sources
    if (options.customBuild) {
        // process each build profile
        options.profiles = options.customBuildConfig.build.slice();
        options.profiles.current = null;
        processProfiles(() => {
            organizeProfiles();
            buildDone();
        });
    } else {
        let srcList = [];
        srcList.push(options.src);  // source itself is the folder
        options.sources = srcList;
        processSources(buildDone); // begin
    }
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
 *                          "copy": [ ] - having path (relative to src path) to copy as is on dest folder
 *                          "modules": [ ] - copy all specified "node_modules" to a root "modules" folder as is, - to handle some modules at client-side
 *                                           NOTE: unlike broserify, it does not check dependencies, therefore only those modules which work independently, are suited for this
 *                          "build": [ ] - having path (relative to src path) to treat as assembly folder group
 *                                      all root level folders under each of these will be treated as one individual assembly
 *                                      Note: if folder name (of assembly folder under it) starts with '_', it is skipped
 *                          "skipMinifyRoot": [ ] - some of the build folders may be skipped for minify (e.g., server folders)
 *                                      those can be defined here, any build folder that starts with the given folder path here will be skipped for minification
 *                                      e.g., "server/app/" here will skip minification for all build folders such as "server/app/group1/", "server/app/group2/", etc.
 *                          "resolveRoot": {
 *                              "<buildPath>": "<removeThisToReachRootPath>" - for each path in "build", define how this will be resolved 
 *                                      when generating path of assemblies underneath
 *                          }
 *                              e.g., "server/app/": "server/" - means, a file at server/app/file.js will be defined as: ./app/file.js - because at runtime server will be the root folder of app
 *                              This means, the second string is replaced with "." in first string
 *                              NOTE: for many build paths that start with same partial path, only one entry may exists here and all build paths
 *                              that start with this path will use same resolveRoot path
 *                          "preambleRoot": {
 *                              "<buildPath>": "<preambleRoot>" - for each path in "build", define where this path's preamble will be created
 *                          }
 *                              e.g., "server/app/": "server/app/" - means, assembly files that exists under path that starts with "server/app/", will have their preamble generated at: "server/app/"preamble.js
 *                              NOTE: for many build paths that start with same partial path, only one entry may exists here and preambles for all build paths
 *                            that start with this path will be generated at same place, in such case, preambles will be merged into one - so there will always be one preamble at one target given path
 *                      }
 *                  }
 *              }
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
 *                                       which are placed on root only. Should be avoided, as this is for flair's own
 *                                       system types
 *                          (assets)   - assets folder
 *                                  > this special folder can be used to place all external assets like images, css, js, fonts, etc.
 *                                  > it can have any structure underneath
 *                                  > all files and folder under it, are copied to destination under <assemnly folder> folder
 *                                  > which means, if an assembly has assets, in destination folder, it will look like:
 *                                      <assembly folder>.js        - the assembly file
 *                                      <assembly folder>.min.js    - the assembly file (minified)
 *                                      <assembly folder>/          - the assembly's assets folder content here under (this is created only if assets are defined)
 *                                  > note, '(assets)' folder itself is not copied, but all contents underneath are copied
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
 * @returns type - flair type for the given object
 */ 
exports.flairBuild = function(options, cb) {
    // build options
    options = options || {};
    options.engine = options.engine || '';
    options.package = options.package || './package.json';

    options.dest = options.dest || './dist';
    options.src = options.src || './src';
   
    options.customBuild = options.customBuild || false; 
    options.customBuildConfig = options.customBuildConfig || '';

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
        'flair.cli'
    ];

    // define logger
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

