var gulp = require('gulp')
          ,sass = require('gulp-sass')
          ,autoprefixer = require('gulp-autoprefixer')
          ,minifyCSS = require('gulp-minify-css')
          ,uglify  = require('gulp-uglify');

gulp.task('default', ['uglify', 'sass', 'img']);

gulp.task('uglify', function() {
  return gulp.src('lib/js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('sass', function () {
  gulp.src('lib/scss/*.scss')
    .pipe(sass({errLogToConsole: true}))
    .pipe(autoprefixer())
    .pipe(minifyCSS())
    .pipe(gulp.dest('dist/css'))
});

gulp.task('img', function () {
  gulp.src('lib/img/*')
    .pipe(gulp.dest('dist/img'))
});
