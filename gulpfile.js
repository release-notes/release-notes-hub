'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

const SRC_PATH = './src';
const SASS_PATH = SRC_PATH + '/stylesheets';
const IMAGES_PATH = SRC_PATH + '/images';
const JS_PATH = SRC_PATH + '/javascripts';
const ASSET_PATH = './public';

//*** SASS compiler task
gulp.task('sass', function () {
  return gulp.src(SASS_PATH + '/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(ASSET_PATH + '/css'));
});

//*** SASS watch(realtime) compiler task
gulp.task('sass:watch', function () {
  gulp.watch([
    SASS_PATH + '/**/*.scss',
    SASS_PATH + '/**/**/*.scss'
  ], ['sass']);
});

gulp.task('copy:images', function() {
  gulp.src([
    IMAGES_PATH + '/**/*.png',
    IMAGES_PATH + '/**/*.svg'
  ]).pipe(gulp.dest(ASSET_PATH + '/img'))
});

gulp.task('js', function() {
  gulp.src([
    JS_PATH + '/*.js',
    JS_PATH + '/**/*.js'
  ])
  .pipe(sourcemaps.init())
  .pipe(uglify())
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest(ASSET_PATH + '/js'))
});


gulp.task('build', function() {
  gulp.start(['sass', 'copy:images', 'js']);
});


