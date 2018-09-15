/*eslint-env node */

const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');

gulp.task('default', ['copy-html', 'copy-images', 'styles', 'lint', 'scripts'], function() {
  gulp.watch('css/**/*.css', ['styles']);
  gulp.watch('js/**/*.js', ['lint']);
  gulp.watch('/index.html', ['copy-html']);
  gulp.watch('js/*.js').on('change', browserSync.reload);
  gulp.watch('css/*.css').on('change', browserSync.reload);
  gulp.watch('./dist/index.html').on('change', browserSync.reload);

  browserSync.init({
    server: './dist'
  });
});

gulp.task('dist', ['copy-html', 'copy-images', 'styles', 'scripts-dist']);

gulp.task('scripts', function() {
  gulp
    .src('js/**/*.js')
    .pipe(concat('all.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function() {
  gulp
    .src('js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['@babel/env']
      })
    )
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('copy-html', function() {
  gulp.src('./index.html').pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function() {
  gulp
    .src('img/*')
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
        })
      ])
    )
    .pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function() {
  gulp
    .src('css/**/*.css')
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions']
      })
    )
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
});

gulp.task('lint', function() {
  return gulp
    .src(['js/**/*.js'])
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});
