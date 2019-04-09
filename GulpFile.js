/* jshint node: true */
'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
sass.compiler = require('node-sass');
var browserSync = require('browser-sync').create();

gulp.task('scss', function() {
  return gulp.src('./scss/**/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});

gulp.task('default', gulp.series('scss', function browserDev(done) {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
  gulp.watch(['scss/*.scss'], gulp.series('scss', function cssBrowserReload(done) {
    browserSync.reload();
    done();
  }));
  gulp.watch(['*.html', '*.js']).on('change', browserSync.reload);
  done();
}));
