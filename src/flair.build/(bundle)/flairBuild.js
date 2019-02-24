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
    name: '<<name>>',
    version: '<<version>>',
    format: 'fasm',
    formatVersion: '1',
    contains: [
        'initializer',      // index.js is built
        'types',            // types are embedded
        'enclosureVars',    // flair variables are made available in a closure where types are bundled
        'enclosedTypes',    // types are places in a closure
        'resources',        // resources are bundled
        'assets',           // assets are processed and their names are added in ado
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
        //      "version": "",
        //      "lupdate": "",
        //      "builder": ""
        //      "copyright": "",
        //      "license": "",
        //      "types": ["", "", ...],
        //      "resources": ["", "", ...],
        //      "assets": ["", "", ...],
        options.current.ado = {
            name: options.current.asmName,
            file: options.current.asm.replace(options.current.dest, '.').replace('.js', '{.min}.js'),
            desc: options.packageJSON.description,
            version: options.packageJSON.version,
            lupdate: new Date().toUTCString(),
            builder: buildInfo,
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
                        if (typeof options.lintConfig.html[rule] !== undefined && options.lintConfig.html[rule] === false) { return; }
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
    const minifyJS = (file) => {
        return new Promise((resolve, reject) => {
            let result = options.minifyJS([file], options.minifyConfig.js);
            if (result.error) { 
                console.log(result.error); // eslint-disable-line no-console
                reject(`Minify for ${file} failed.`); 
            } else {
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
                dest = src.replace('.' + ext, '.min.' + ext);
            if (options.minifyTypes.indexOf(ext) !== -1) {
                let p = null;
                switch(ext) {
                    case 'js': p = minifyJS(src); break;
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
            if (options.gzip) {
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
            if (options.minify) {
                minifyFile(astFile.dest).then(() => {
                    if (fsx.existsSync(minFile)) {
                        astFile.stat += ', ' + Math.round(fsx.statSync(minFile).size / 1024) + 'kb minified';
                    }
                    afterMinify();
                }).catch((err) => { throw err; });
            } else { // delete old existing
                if (!options.fullBuild && fsx.existsSync(minFile)) { fsx.removeSync(minFile); }
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
    const appendTypes = (done) => {
        if (options.current.ado.types.length === 0) { done(); return; }

        // append closure header with settings
        let settings = '';
        if (fsx.existsSync(options.current.asmSettings)) {
            settings = JSON.stringify(fsx.readJSONSync(options.current.asmSettings));
            logger(0, 'settings',  options.current.asmSettings);
        }
        let closureHeader = 
        `(() => {\n` + 
        `'use strict';\n\n` +
        `const { $$, attr, Class, Struct, Enum, Interface, Mixin, Exception, Args } = flair;                         // eslint-disable-line no-unused-vars\n` +
        `const { Aspects, AppDomain, Container, Reflector, Serializer } = flair;                                     // eslint-disable-line no-unused-vars\n` +
        `const { getAttr, getAssembly, getResource, getTypeOf } = flair;                                             // eslint-disable-line no-unused-vars\n` +
        `const { getType, typeOf, as, is, isDerivedFrom, isInstanceOf, isComplies, isImplements, isMixed } = flair;  // eslint-disable-line no-unused-vars\n` +
        `const { include, dispose, using, on, dispatch } = flair;                                                    // eslint-disable-line no-unused-vars\n` +
        `const { noop, telemetry } = flair;                                                                          // eslint-disable-line no-unused-vars\n` +
        `const { isServer, isWorker } = flair.options.env;                                                           // eslint-disable-line no-unused-vars\n` +
        `\n`; 
        if (settings) { // settings is a closure variable of each assembly separately
            closureHeader += 
        `const settings = JSON.parse('${settings}'); // eslint-disable-line no-unused-vars\n`;
        } else {
        `const settings = {}; // eslint-disable-line no-unused-vars\n`;
        }
        appendToFile(closureHeader);

        logger(0, 'types', '');

        // activate current file name
        let dump = `flair.AppDomain.context.current().currentAssemblyBeingLoaded('${options.current.ado.file}');\n`;
        appendToFile(dump);

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

        // deactivate current file name
        dump = `flair.AppDomain.context.current().currentAssemblyBeingLoaded('');\n`;
        appendToFile(dump);

        // append closure footer
        let closureFooter = 
        `\n` + 
        `})();\n`;
        appendToFile(closureFooter);
        
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
            content = new Buffer(content).toString('base64');
            encodingType += 'base64;';

            // embed resource
            let rdo = {
                name: nsFile.qualifiedName,
                encodingType: encodingType,
                asmFile: options.current.ado.file,
                file: './' + nsFile.file,
                data: content
            };

            let dump = `(() => { let rdo = JSON.parse('${JSON.stringify(rdo)}'); flair.AppDomain.context.current().registerResource(rdo);})();\n`;
            appendToFile(dump);

            appendResources(done, justNames2); // pick next
        };
        const afterLint = () => {
            // minify/read resource
            if (options.minifyResources) {
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
    const appendSelfRegistration = () => {
        if (options.skipRegistrationsFor.indexOf(options.current.asmName) !== -1) { return; } // skip for special cases

        logger(0, 'self-reg', 'yes'); 
        let dump = `(() => { flair.AppDomain.registerAdo('${JSON.stringify(options.current.ado)}');})();\n`;
        appendToFile(dump);
    };
    const pack = (done) => {
        options.current.stat = options.current.asm.replace(options.current.dest, '.') + ' (' + Math.round(fsx.statSync(options.current.asm).size / 1024) + 'kb';

        let minFile = '';
        const afterGzip = () => {
            options.current.stat += ')';
            done();
        };
        const afterMinify = () => {
            // gzip
            let gzFile = minFile + '.gz';
            if (options.gzip) {
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
            if (options.minify) {
                minifyFile(options.current.asm).then(() => {
                    options.current.stat += ', ' + Math.round(fsx.statSync(minFile).size / 1024) + 'kb minified';
                    afterMinify();
                }).catch((err) => { throw err; });
            } else { // delete old existing
                if (!options.fullBuild && fsx.existsSync(minFile)) { fsx.removeSync(minFile); }
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

        logger(0, 'preamble', options.current.preamble.replace(options.current.dest.replace('./', ''), '.'));
        let ados = JSON.stringify(options.current.adosJSON);
        let dump = `(() => { let ados = JSON.parse('${ados}');flair.AppDomain.registerAdo(ados);})();`;
        fsx.writeFileSync(options.current.preamble, dump);
    };
    const collectTypesAndResources = () => {
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
  
    const processNamespaces = (done) => {
        if (options.current.namespaces.length === 0) { 
            delete options.current.nsName;
            delete options.current.nsPath;
            done(); return; 
        }
        let nsFolder = options.current.namespaces.splice(0, 1)[0]; // pick from top
        if (nsFolder.startsWith('_')) { processNamespaces(done); return; } // ignore if starts with '_'
        if (['(assets)', '(bundle)'].indexOf(nsFolder) !== -1) { processNamespaces(done); return; } // skip special folders at namespace level

        options.current.nsName = nsFolder;
        options.current.nsPath = './' + path.join(options.current.asmPath, options.current.nsName);

        // collect types and resources 
        collectTypesAndResources();

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
        options.current.asmMain = './' + path.join(options.current.src, options.current.asmName, 'index.js');
        options.current.asmSettings = './' + path.join(options.current.src, options.current.asmName, 'settings.json');

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
                // append types, resources and self-registration
                appendTypes(() => {
                    appendResources(() => {
                        appendSelfRegistration();

                        // lint, minify and gzip assembly
                        pack(() => {
                            logger(0, '==>', options.current.stat); 
        
                            processAssemblies(done); // pick next
                        });
                    });
                });
            });
        });
    };
    const processSources = (done) => {
        // pick source
        if (options.sources.length === 0) { done(); return; }
        let source = options.sources.splice(0, 1)[0]; // pick from top
        if (source.startsWith('_')) { processSources(done); return; } // ignore if starts with '_'

        // start group
        logger(0, 'group', `${source.replace(source, '.')} (start)`, true);  
        options.current = {};
        options.current.src = source;
        options.current.dest = source.replace(options.current.src, options.dest);
        options.current.adosJSON = [];
        options.current.preamble = path.join(options.current.dest, 'preamble.js');

        // process all assemblies under this group
        let folders = getFolders(options.current.src, true);
        options.current.assemblies = folders;
        processAssemblies(() => {
            // create group preamble
            createPreamble();

            // done
            logger(0, 'group', `${source.replace(source, '.')} (end)`, true);  
            options.current = {};
            processSources(done);
        });
    };

    // delete all dest files
    if (options.fullBuild) {
        delAll(options.dest);
        logger(0, 'clean', 'done');
    }

    // begin
    processSources(done);
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
 *                  "js": { NOTE: Option configuration comes from: https://github.com/mishoo/UglifyJS2#minify-options
 *                  },
 *                  "css": { NOTE: Option configuration comes from: https://www.npmjs.com/package/clean-css
 *                  },
 *                  "html": { NOTE: Option configuration comes from: https://www.npmjs.com/package/html-minifier
 *                  }
 *              }
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
 *                          (assets)   - assets folder
 *                                  > this special folder can be used to place all external assets like images, css, js, third-party
 *                                    libraries, fonts, etc.
 *                                  > it can have any structure underneath
 *                                  > all files and folder under it, are copied to destination under <assemnly folder> folder
 *                                  > which means, if an assembly has assets, in destination folder, it will look like:
 *                                      <assembly folder>.js        - the assembly file
 *                                      <assembly folder>.min.js    - the assembly file (minified)
 *                                      <assembly folder>/          - the assembly's assets folder content here under (this is created only if assets are defined)
 *                                  > note, '(assets)' folder itself is not copied, but all contents underneath are copied
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
        options.lintTypes = ['js']; // for quick builds run lint only for JS files
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
        '1flair',
        '1flair.build'
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
            options.minifyJS = require('uglify-js-harmony').minify;
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