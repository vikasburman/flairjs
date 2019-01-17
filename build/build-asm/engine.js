/**
 * FlairJS - Build Engine
 * (c) 2017-2019 Vikas Burman
 * MIT
 */

const rrd = require('recursive-readdir-sync');
const copyDir = require('copy-dir');
const path = require('path');
const fsx = require('fs-extra');
const del = require('del');
const CLIEngine = new require("eslint").CLIEngine
const uglifyjs = require('uglify-js-harmony');
const uuid = require('uuid/v1');

let uglifyConfig, 
    eslintConfig,
    packageJSON, 
    eslint, 
    eslintFormatter = null;

// arguments reader
let readArgs = function() {
    let argList = process.argv,
        arg = {}, a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {
      thisOpt = argList[a].trim();
      opt = thisOpt.replace(/^\-+/, '');

      if (opt === thisOpt) {
        // argument value
        if (curOpt) arg[curOpt] = opt;
        curOpt = null;
      }
      else {
        // argument name
        curOpt = opt;
        arg[curOpt] = true;
      }
    }
    return arg;
};
// error handler
let errorHandler = (name) => {
  return function (err) {
      console.error('Error in task: ' + name);
      console.error('Error: ' + err.toString());
  };
};
// get folders under given root
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

// do
const doTask = (srcList, srcRoot, destRoot, done) => {
    // srcList is an array of source paths that need to be processed for assembly building
    // injections data
    let injections = [];

    // get guid
    const guid = () => { 
        return uuid().replace(new RegExp('-', 'g'), '_'); 
    };

    // find injection
    const findNextInjection = (content, root) => {
        let prefix = '//// gears.inject:',
            suffix = '////'
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
                    console.log('    >> inject: ' + injection.file + ' (min: ' + (injection.file === minifiedFile ? 'missing, used same' : minifiedFile) + ')');

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
            console.log(eslintFormatter(lintReport.results));
            if (lintReport.errorCount > 0) {
                throw `${lintReport.errorCount} Linting warnerrors found.`;
            }
        }
    };

    // minify code
    const minifyFile = (jsFile) => {
        let result = uglifyjs.minify([jsFile], uglifyConfig.js);
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
        // each resource name is the qualfied name of the resource following by .res.<ext>
        // so for example, a resource gears.abc.res.json can be placed anywhere
        // and it will be accessible as Resource.get('gears.abc').JSON
        let resData = '',
            ext = path.extname(resFile).toLowerCase(),
            resName = '',
            content = '';
        resName = path.basename(resFile);
        resName = resName.substr(0, resName.indexOf('.res'));

        // read file
        if (['txt', 'xml', 'js', 'md', 'json', 'css', 'html'].indexOf(ext) === -1) { // utf8 encoding
            content = fsx.readFileSync(resFile, 'utf8');
        } else { // no encoding
            content = fsx.readFileSync(resFile);
        }
        content = new Buffer(content).toString('base64');

        // add to minified
        let dump = `;flair.Resource("${resName}", "${resFile}", "${content}");`;
        appendToFile(asm_min, dump);

        // add to standard
        dump = `\n // START: ${resFile}\n${dump}\n // END: ${resFile}`;
        appendToFile(asm, dump);

        // log
        console.log('    res: ' + resName + ' (' +  resFile + ')');

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
        console.log('  asset: ' + path.basename(astFile) + ' -> ' + path.basename(destFile) + ' (' + path.dirname(astFile) + ' -> ' + path.dirname(destFile) + ')');
    };

    // append type
    const appendType = (ado, asm, asm_min, typeFile) => {
        // each type name is the qualfied name of the type following by .js
        // so for example, a type gears.App.js can be placed anywhere
        // and it will be accessible as gears.App type via bring or other means
        let ext = path.extname(typeFile).toLowerCase(),
            typeName = path.basename(typeFile, '.js');

        // log
        console.log('   type: ' + typeName + ' (' + typeFile + ')');

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
            theFile = '';
        for(let file of files) { 
            ext = path.extname(file).toLowerCase();
            theFile = './' + file;
            if (theFile.indexOf('/_') !== -1) { continue; }
            if (theFile === mainFile) { continue; }
            if (theFile === steFile) { continue; }
            if (ext === '.js') {
                if (file.endsWith('.spec.js')) { // spec
                    console.log('   spec: Skipped! (' + theFile + ')');
                } else if (file.endsWith('.res.js')) { // resource
                    appendResource(ado, asm, asm_min, theFile);
                } else if (file.endsWith('.ast.js')) { // asset
                    copyAsset(ado, asm, asm_min, theFile, src, dest);
                } else { // type
                    appendType(ado, asm, asm_min, theFile);
                }
            } else {
                if (['.html', '.css', '.xml', '.txt', '.md', '.json', '.png', '.jpg', '.jpeg', '.gif'].indexOf(ext) !== -1) {
                    if (file.endsWith('.ast' + ext)) { // known asset type
                        copyAsset(ado, asm, asm_min, theFile, src, dest);
                    } else if (file.endsWith('.res' + ext)) { // known resource type
                        appendResource(ado, asm, asm_min, theFile);
                    } else { // unknown scheme of things
                        throw `Unknown file scheme ${theFile}.`;
                    }
                } else { // unknown file type
                    if (file.endsWith('.ast' + ext)) { // some unknown asset type
                        copyAsset(ado, asm, asm_min, theFile, src, dest);
                    } else if (file.endsWith('.res' + ext)) { // some unknown resource type
                        appendResource(ado, asm, asm_min, theFile);
                    } else { // unknown scheme of things
                        throw `Unknown file scheme ${theFile}.`;
                    }
                }
            }
        }
    };

    // append main file
    const appendMain = (asm, asm_min, fle, src) => {
        // pick fle, if exists
        if (fsx.existsSync(fle)) {
            // log
            console.log('   main: ' + path.basename(fle) + ' (' + fle + ')'); 

            // process injections
            let content = processInjections(fle);

            // LintMinifyAppend
            lintMinifyAppend(asm, asm_min, fle, content);
        } else {
            // log
            console.log('   main: (not found)'); 
        }
    };

    const appendSettings = (ado, asm, asm_min, steFile) => {
        if (fsx.existsSync(steFile)) {
            // log
            console.log(' config: ' + steFile);

            // register with ado
            appendSettingsToADO(ado, JSON.parse(fsx.readFileSync(steFile)));
        } else {
            // log
            console.log(' config: (not found)');
        }
    };

    // append ADO
    const appendADO = (ados, asm, asm_min, asmName, dest) => {
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
            console.log('\nasm: ' + asmName);

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
            //  note: resource name is the file name minus ".res.<ext>". e.g., gears.mainCSS.res.css will be available as gears.mainCSS resource
            // all *.ast.* files are treated as assets and copied in same folder structure to assembly name folder at dest
            //  note: while copying, the ".ast" is removed, so file name becomes natural file name
            // all *.js are treated as types and bundled
            // all *.js files are looked for "//// gears.inject: <relative file name> ////" patters and defined file is injected in-place
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
            console.log('==> ' + path.basename(asm) + ' (' + Math.round(stat.size / 1024) + 'kb, ' + Math.round(stat_min.size / 1024) + 'kb minified)\n');
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
    options.packageJSON = options.packageJSON || './package.json';
    options.cb = options.cb || cb;

    // get files
    uglifyConfig = fsx.readFileSync(options.uglifyConfig, 'utf8');
    eslintConfig = fsx.readFileSync(options.eslintConfig, 'utf8');
    packageJSON = fsx.readFileSync(options.packageJSON, 'utf8');

    // get engines
    eslint = new CLIEngine(eslintConfig);
    eslintFormatter = eslint.getFormatter();

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
 