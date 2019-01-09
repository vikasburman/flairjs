const gulp = require('gulp');

// task: bump
gulp.task('bump', (done) => {
    require('./build/tasks/bump.js').bump(done);
});

// task: build
gulp.task('build', (done) => {
    require('./build/tasks/build.js').build(done);
});

// task: test
gulp.task('test', (done) => {
    require('./build/tasks/test.js').test(done);
});

// task: release
gulp.task('release', ['bump', 'build', 'test'], () => {
});

// task: default
gulp.task('default', ['build', 'test'], () => {
});