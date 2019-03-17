const gulp = require('gulp');
const gulpOptions = require('./config/gulp.json');

// task: build
gulp.task('build', (done) => {
    require(gulpOptions.build).build(done);
});
gulp.task('build-full', (done) => {
    require(gulpOptions.build).build(done);
});
gulp.task('build-quick', (done) => {
    require(gulpOptions.build).build(done);
});

// task: test
gulp.task('test', (done) => {
    require(gulpOptions.test).test(done);
});
gulp.task('test-client', (done) => {
    require(gulpOptions.test).test(done);
});

// task: package
gulp.task('package', (done) => {
    require("./publish/package.js").pack(done);
});
