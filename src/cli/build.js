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
 const _cli = Object.freeze({
    build: (isServer ? require('./flair.build.js') : null)
});

// expose
flair.cli = _cli;
flair.members.push('cli');
