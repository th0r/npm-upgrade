const gulp = require('gulp');

gulp.task('default', watch);
gulp.task(watch);
gulp.task('build', gulp.series(clean, build));
gulp.task(clean);

const SRC = 'src/**/*.js';
const DEST = 'lib';

function clean() {
  const del = require('del');
  return del('lib');
}

function build() {
  const babel = require('gulp-babel');

  return gulp.src(SRC)
    .pipe(babel())
    .pipe(gulp.dest(DEST));
}

function watch() {
  gulp.watch(SRC, {ignoreInitial: false}, build);
}
