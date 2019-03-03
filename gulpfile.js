const gulp = require('gulp');
const gulpOptions = require('./config/gulp.json');

// task: build
gulp.task('build', (done) => {
    require(gulpOptions.build).build(done);
});

// task: test
gulp.task('test', (done) => {
    require(gulpOptions.test).test(done);
});

// task: package
gulp.task('package', (done) => {
    require(gulpOptions.package).pack(done);
});

// task: release
gulp.task('release', ['build-full', 'test', 'package'], () => {
});

gulp.task('fiddle', (done) => {
    console.log('write some code');
});