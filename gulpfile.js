/*eslint-env node */

const browserify = require('browserify');
const gulp = require('gulp');
//vinyl is a virtual file format that gulp expects
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const babelify = require('babelify');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const log = require('gulplog');
const del = require('del');

const mainFiles = ['js/dbhelper.js', 'js/main.js'];
const restaurantFiles = ['js/dbhelper.js', 'js/restaurant_info.js'];

gulp.task('default', ['styles-dist', 'scripts-dist'], function() {
  browserSync.init({ server: './' });

  gulp.watch('css/**/*.css', ['styles-dist']);
  gulp.watch('js/**/*.js', ['scripts-dist']);
  gulp.watch('js/*.js').on('change', browserSync.reload);
  gulp.watch('css/*.css').on('change', browserSync.reload);
  browserSync.stream();
});

gulp.task('dist', ['clean', 'copy-html', 'copy-images', 'lint', 'styles-dist', 'scripts-dist']);

gulp.task('clean', function() {
  return del(['dist/*']);
});

gulp.task('copy-html', () => {
  gulp.src('index.html').pipe(gulp.dest('dist/'));
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

gulp.task('lint', function() {
  return gulp
    .src(['js/**/*.js'])
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('styles-dist', function() {
  gulp
    .src(['css/404.css', 'css/styles.css', 'css/media.css'])
    .pipe(sourcemaps.init())
    .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(concat('all.css'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('scripts-dist', function() {
  mainFiles.map((file) => {
    return browserify({
      entries: [file],
      debug: true
    })
      .transform(babelify, { presets: ['@babel/env'], sourceMaps: true })
      .bundle()
      .pipe(source('main.bundle.js')) //pipe to output file
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .on('error', log.error)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist/js'));
  });

  restaurantFiles.map((file) => {
    return browserify({
      entries: [file],
      debug: true
    })
      .transform(babelify, { presets: ['@babel/env'], sourceMaps: true })
      .bundle()
      .pipe(source('restaurant.bundle.js')) //pipe to output file
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .on('error', log.error)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist/js'));
  });
});
