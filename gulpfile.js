var gulp = require('gulp')
          ,sass = require('gulp-sass')
          ,autoprefixer = require('gulp-autoprefixer')
          ,minifyCSS = require('gulp-minify-css')
          ,uglify  = require('gulp-uglify')
          ,rename = require('gulp-rename');

gulp.task('default', ['build-js', 'sass', 'img']);

gulp.task('build-js', function() {
  return gulp.src('lib/js/*.js')
    .pipe(gulp.dest('dist/js'))
    .pipe(rename({
      suffix: '.min'
     }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('sass', function () {
  gulp.src('lib/scss/*.scss')
    .pipe(sass({errLogToConsole: true}))
    .pipe(autoprefixer())
    .pipe(gulp.dest('dist/css'))
    .pipe(minifyCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('dist/css'))
});

gulp.task('img', function () {
  gulp.src('lib/img/*')
    .pipe(gulp.dest('dist/img'))
});
