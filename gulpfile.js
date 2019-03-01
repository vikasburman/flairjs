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
    const {
        Worker, isMainThread, parentPort, workerData
      } = require('worker_threads');
     
      console.log(process.argv);
      let w = new Worker('console.log(require("worker_threads").workerData); console.log(require("worker_threads").isMainThread)', {eval: true, workerData: process.argv});
      //console.log(isMainThread);

});