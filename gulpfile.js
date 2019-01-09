const gulp = require('gulp');
const eslint = require('gulp-eslint');
const uglifyjs = require('uglify-js-harmony');
const uglify = require('gulp-uglify');
const minifier = require('gulp-uglify/minifier');
const jasmineNode = require('gulp-jasmine');
const pkg = require('./package.json');
const uglifyConfig = require('./build/.uglify.json');
const rename = require('gulp-rename');
const inject = require('gulp-inject-file');
const replace = require('gulp-string-replace');
const fs = require('fs');
const packageJSON = JSON.parse(fs.readFileSync('./package.json', 'utf8'));


// error handler
const errorHandler = (name) => {
    return function (err) {
        console.error('Error in task: ' + name);
        console.error('Error: ' + err.toString());
    };
};

// arguments reader
const readArgs = function() {
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

// task: bump
gulp.task('bump', (done) => {
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
    packageJSON.version = ver[0].toString() + '.' + ver[1].toString() + '.' + ver[2].toString();
    fs.writeFileSync('./package.json', JSON.stringify(packageJSON, null, 4), 'utf8');

    // done
    done();
});

// task: build
gulp.task('build', (done) => {
    let buildCore = () => {
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
    buildCore();         
});

// task: test
gulp.task('test', (done) => {
    const jasminConfig = require('./build/.jasmine.json'),
        tests = ['./specs/*.spec.js'];
    gulp.src(tests)
        .pipe(jasmineNode(jasminConfig))
        .on('end', done)
        .on('error', errorHandler('jasmine'));
    // HACK: pipe() is not exising and hence end/error done() is not called via pipe, 
    // so calling done() manually below - this seems to be working so far
    // but need to be revisited for a better solution
    done(); 
});

// task: release
gulp.task('release', ['bump', 'build', 'test'], () => {
});

// task: default
gulp.task('default', ['build', 'test'], () => {
});