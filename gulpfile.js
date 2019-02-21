const gulp = require('gulp');

// task: build
gulp.task('build', (done) => {
    require('./gulp/tasks/build.js').build(done);
});

// task: test
gulp.task('test', (done) => {
    require('./gulp/tasks/test.js').test(done);
});

// task: package
gulp.task('package', (done) => {
    require('./gulp/tasks/package.js').pack(done);
});

// task: release
gulp.task('release', ['build-full', 'test', 'package'], () => {
});
