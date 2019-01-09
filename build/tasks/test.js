const gulp = require('gulp');
const gulpConfig = require('../config/.gulp.json');
const jasmineNode = require('gulp-jasmine');
const jasminConfig = require('../config/.jasmine.json');
const errorHandler = require('../utils.js').errorHandler;
const tests = gulpConfig.specs;

// do
const doTask = (done) => {
    gulp.src(tests)
        .pipe(jasmineNode(jasminConfig))
        .on('end', done)
        .on('error', errorHandler('jasmine'));
    // HACK: pipe() is not exising and hence end/error done() is not called via pipe, 
    // so calling done() manually below - this seems to be working so far
    // but need to be revisited for a better solution
    done();
};
exports.test = function(cb) {
    doTask(cb);
};