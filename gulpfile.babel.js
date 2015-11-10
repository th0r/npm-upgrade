const gulp = require('gulp');
const babel = require('gulp-babel');
const del = require('del');

gulp.task('default', ['build']);

gulp.task('clean', () => del('lib'));

gulp.task('build', ['clean'], () =>
    gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('./lib'))
);