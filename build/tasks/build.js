const gulp = require('gulp');
const eslint = require('gulp-eslint');
const uglifyjs = require('uglify-js-harmony');
const uglify = require('gulp-uglify');
const minifier = require('gulp-uglify/minifier');
const uglifyConfig = require('../.uglify.json');
const rename = require('gulp-rename');
const inject = require('gulp-inject-file');
const replace = require('gulp-string-replace');
const packageJSON = JSON.parse(fs.readFileSync('../../package.json', 'utf8'));
const errorHandler = require('../utils.js').errorHandler;

// do
const doTask = (done) => {
    let destName = packageJSON.name;
    gulp.src('./src/index.js')
    // assemble pieces
    .pipe(inject())
    .on('error', errorHandler('assemble'))

    // write assembled
    .pipe(rename((path) => {
        path.basename = destName;
    }))
    .on('error', errorHandler('rename'))     
    .pipe(replace('<basename>', destName))
    .pipe(replace('<title>', packageJSON.title))
    .pipe(replace('<desc>', packageJSON.description))
    .pipe(replace('<version>', packageJSON.version))
    .pipe(replace('<copyright>', packageJSON.copyright))
    .pipe(replace('<license>', packageJSON.license))
    .pipe(replace('<datetime>', new Date().toUTCString()))
    .pipe(gulp.dest('./dist'))
    .on('error', errorHandler('write-assembled'))

    // check for issues
    .pipe(eslint('./build/.eslint.json'))
    // format errors, if any
    .pipe(eslint.format())
    // stop if errors
    .pipe(eslint.failAfterError())
    
    // minify
    .pipe(minifier(uglifyConfig.js, uglifyjs))
    .on('error', errorHandler('minifier'))
    
    // write minified
    .pipe(rename((path) => {
        path.extname = '.min.js'; // from <name.whatever>.js to <name.whatever>.min.js
    }))
    .on('error', errorHandler('rename'))
    .pipe(replace(destName + '.js', destName + '.min.js'))
    .pipe(gulp.dest('./dist'))
    .on('end', done)
    .on('error', errorHandler('write-minified'));
};
exports.build = function(cb) {
    doTask(cb);
};