// 宣告 gulp 物件
var argv = require('minimist')(process.argv.slice(2)),
     runSequence = require('run-sequence'),
     gulp = require('gulp'),
     gutil = require('gulp-util'),
     watch = require('gulp-watch'),
     pug = require('gulp-pug'),
     compass = require('gulp-compass'),
     yaml = require('gulp-yaml'), // 必須安裝 js-yaml
     jsonFormat = require('gulp-json-format'),
     data = require('gulp-data'),
     cleanCSS = require('gulp-clean-css'),
     concat = require('gulp-concat'),
     sourcemaps = require('gulp-sourcemaps'),
     vendor = require('gulp-concat-vendor'),
     uglify = require('gulp-uglify'),
     imagemin = require('gulp-imagemin'),
     Path = require("path"),
     connect = require('gulp-connect'),
     browserSync = require('browser-sync').create(),
     babel = require('gulp-babel'),
     browserify = require('browserify'),
     stripDebug = require('gulp-strip-debug'), // remove console.log
     source = require('vinyl-source-stream'),
     buffer = require('vinyl-buffer')

var opacity = function (css, opts) {
    css.eachDecl(function(decl) {
        if (decl.prop === 'opacity') {
            decl.parent.insertAfter(decl, {
                prop: '-ms-filter',
                value: '"progid:DXImageTransform.Microsoft.Alpha(Opacity=' + (parseFloat(decl.value) * 100) + ')"'
            });
        }
    });
};

// CLI options
var enabled = {
  // Enable static asset revisioning when `--production`
  rev: argv.production,
  // Disable source maps when `--production`
  maps: !argv.production,
  // Fail styles task on error when `--production`
  failStyleTask: argv.production,
  // Fail due to JSHint warnings only when `--production`
  failJSHint: argv.production,
  // Strip debug statments from javascript when `--production`
  stripJSDebug: argv.production
};

dev_path = {
  pug:     './src/pug/',
  js:        './src/js/',
  sass:     './src/sass/',
  images:  './src/images/'
};

build_path = {
  html:     './dist/',
  css:      './dist/assets/css/',
  js:        './dist/assets/js/',
  images:  './dist/assets/images/',
  json:      './json/'
};

// chrome plugin glup-devtools
module.exports = gulp;

// 顯示錯誤資訊
function swallowError (error) {
  // If you want details of the error in the console
  console.log(error.toString());
  this.emit('end');
}


// // 宣告 normalize 路徑
// var path = {
//   normalize: "bower_components/normalize-css/normalize.css",
// };

// livereload server
gulp.task('connect', function() {
  connect.server({
    root: 'dist',
    port: '8888',
    livereload: true
  });
});



// 讀 yaml 檔轉 json
gulp.task('yaml', function() {
  return gulp.src('./*y{,a}ml')
  .pipe(yaml())
  .on('error', console.log)
  .pipe(gulp.dest(build_path.json));
});

gulp.task('jsonFormat', ['yaml'], function() {
  return gulp.src(build_path.json + '*.json')
    .pipe(jsonFormat(4))
    .pipe(gulp.dest(build_path.json));
});

// 編譯 pug
gulp.task('pug', ['jsonFormat'], function() {
  return gulp.src([dev_path.pug + '*.pug', '!' + dev_path.pug + '/**/_*.pug'])
    .pipe(data((function(file) {
      return require(build_path.json + "site.json");
    })))
    .pipe(data((function(file) {
      return require(build_path.json + "data.json");
    })))
    .pipe(pug({
      pretty: true
    }))
    .on('error', swallowError)
    .pipe(gulp.dest(build_path.html))
    .pipe(connect.reload());
});

// 編譯 css ( sass )
gulp.task('sass', function() {
    return gulp.src([dev_path.sass + '*.scss', '!' + dev_path.sass + '/**/_*.scss'])
       .pipe(compass({
            // sourcemap: true,
            time: true,
            css: build_path.css,
            sass: dev_path.sass,
            style: 'compressed' //nested, expanded, compact, compressed
       }))
       .on('error', swallowError)
       .pipe(gulp.dest(build_path.css))
       .pipe(connect.reload());
});

// 壓縮圖片
gulp.task('imagemin', function(){
  gulp.src( dev_path.images + '*.{png,jpg,gif,svg,ico}')
    .pipe(imagemin())
    .pipe(gulp.dest( build_path.images ))
    .pipe(connect.reload());
});

// 編譯 js
gulp.task('convertJS_dev', function(){
  return gulp.src( [dev_path.js + 'main.js'])
    .pipe(babel({
      presets: ['es2015']
    }))
    .on('error', swallowError)
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(connect.reload());
});

gulp.task('convertJS_pro', function(){
  return gulp.src( [dev_path.js + 'main.js'])
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(stripDebug())
    .pipe(uglify())
    // .on('error', swallowError)
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(connect.reload());
});

gulp.task('js', function(){
  return gulp.src( [dev_path.js + '*.js', '!' + dev_path.js + 'main.js'])
    // .pipe(uglify()) // uglify js
    .on('error', swallowError)
    .pipe(gulp.dest( build_path.js ))
    .pipe(connect.reload());
});

// Browserify 
gulp.task('browserify', function() {
  var b = browserify({
    entries: build_path.js + 'main.js'
  });

  return b.bundle()
    .pipe(source("bundle.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(build_path.js))
});


// 產生 vendor js
// 注意！這邊是有使用 bower 的情況下用
gulp.task('vendor-scripts', function() {
  gulp.src('bower_components/**/**/*.min.js')
  .pipe(vendor('vendor.js'))
  .pipe(gulp.dest( build_path.js ));
});
// 產生 plugin js
gulp.task('plugin-scripts', function() {
  gulp.src('src/plugin/*.js')
  .pipe(vendor('plugin.js'))
  .pipe(uglify())
  .pipe(gulp.dest( build_path.js ))
  .pipe(connect.reload());
});

//browser-sync
gulp.task('bro-sync', ['pug','sass','convertJS_dev'], function() {
  browserSync.init({
      server: build_path.html
  });
  gulp.watch( dev_path.css + "**/*.scss", ['sass']);
  gulp.watch( dev_path.pug + "**/*.pug", ['pug']);
  gulp.watch( dev_path.js + "*.js", ['convertJS_dev', 'browserify',]);
  gulp.watch( 'src/*.js', ['js'] );
  gulp.watch( 'src/plugin/*.js', ['plugin-scripts'] );
});

// 監聽檔案
gulp.task('watch', function(){
  // gulp.watch('src/slim/**/*.slim', ['slim']);
  gulp.watch( dev_path.pug + '**/*.pug', ['pug']);
  gulp.watch( dev_path.sass + '**/*.scss', ['sass']);
  gulp.watch( [dev_path.js + 'main.js'], ['convertJS_dev', 'browserify']);
  gulp.watch( [dev_path.js + '*.js', '!' + dev_path.js + 'main.js'], ['js'] )
  gulp.watch( 'src/plugin/*.js', ['plugin-scripts'] )
  gulp.watch( dev_path.images + '*.{png,jpg,gif,svg,ico}', ['imagemin']);
});

// 預設啟動 gulp
gulp.task('default', ['pug','sass','plugin-scripts','imagemin','convertJS_dev','js','browserify','connect','watch'],function(callback) {});


// 發佈 production 版本 ( gulp build --pro )
gulp.task('build', function(callback) {
  var tasks = [
    'pug',
    'sass',
    'plugin-scripts',
    'imagemin',
  ];

  if (argv.pro) {
    // only add upload to task list if `--pro`
    tasks = tasks.concat(['convertJS_pro','js','browserify']);
  }

  runSequence.apply(
    this,
    tasks.concat([callback])
  );
});