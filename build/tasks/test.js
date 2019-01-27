const gulp = require('gulp');
const jasmineNode = require('gulp-jasmine');
const jasminConfig = require('../config/.jasmine.json');
const tests = [
    "./specs/**/*.spec.js"
];

// error handler
let errorHandler = (name) => {
    return function (err) {
        console.error('Error in task: ' + name);
        console.error('Error: ' + err.toString());
    };
};

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