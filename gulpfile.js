const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const del = require('del');
const runSequence = require('run-sequence');
const $ = gulpLoadPlugins();

gulp.task('scripts', () => {
  return gulp.src('src/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('minified', ['scripts'], () => {
  return gulp.src('dist/*')
    .pipe($.if('*.js', $.sourcemaps.init()))
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.js', $.sourcemaps.write('.')))
    .pipe(gulp.dest('dist'));
});

function lint(files, options) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe($.eslint.format())
}

gulp.task('lint', () => {
  return lint('src/*.js')
    .pipe(gulp.dest('src'));
});

gulp.task('clean', del.bind(null, ['dist']));


gulp.task('build', ['lint', 'minified'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', () => {
  return new Promise(resolve => {
    runSequence(['clean'], 'build', resolve);
  });
});
