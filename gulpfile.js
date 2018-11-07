'use strict';
// project
var projectName = require('path').basename(__dirname); // grabs the current folder name
var assetCDN = 'https://cdn-static.farfetch-contents.com/Content/UP/editorial_assets/'+projectName+'/';
var assetPath = '/assets/';
var feedPath = 'https://www.farfetch.com/uk';
// gulp
var browserSync = require('browser-sync');
var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp'); // using gulp 4.0, that supports sequential tasks, and parallel tasks
var sass = require("gulp-sass");
var pug = require('gulp-pug');
var data = require('gulp-data');
var fs = require('fs');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var log = require('gulplog');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var rename = require('gulp-rename');
var puppeteer = require('puppeteer');

// browserify
var customOpts = {
  entries: ['./src/js/main.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

gulp.task('javascript', bundle);
b.on('update', bundle);
b.on('log', log.info);

function bundle() {
  return b.bundle()
    .on('error', log.error.bind(log, 'Browserify Error'))
    .pipe(source('./main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify())
      .on('error', log.error)
    .pipe(gulp.dest('./dist/js'))
    .pipe(sourcemaps.write('./')) // writes .map file on tmp only
    .pipe(gulp.dest('./tmp/js'));
}

// sass
gulp.task('sass', function () {
  return gulp.src('./src/css/*.scss', { allowEmpty: true })
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(gulp.dest('./dist/css/'))
    .pipe(gulp.dest('./tmp/css/'))
    .pipe(browserSync.stream());
});

// Assets
gulp.task('assets', function(){
  return gulp.src('./src/assets/**',{ allowEmpty: true })
    .pipe(gulp.dest('./dist/assets'))
    .pipe(gulp.dest('./tmp/assets'));
})

// Clean
gulp.task('clean', function(){
  return gulp.src(['./dist','./tmp'], {read: false, allowEmpty:true})
        .pipe(clean());
})

// HTML / PUG
gulp.task('html-tmp', function(done){
  var translations = JSON.parse(fs.readFileSync('./src/_data/translations.json'));
  translations.forEach(function(item){
    return gulp.src(['!./src/_layout/*','!./src/_modules/*','!./src/html/*','./src/*.pug'])
        .pipe(data(function(file) {
            return item
        }))
        .pipe(data(function(){
            return {'assetPath': assetPath,'feedPath': feedPath}
        }))
        .pipe(pug())
        .pipe(rename({suffix: '_'+item.version}))
        .pipe(gulp.dest('./tmp'))
        .pipe(browserSync.stream());
  })
  done()
});

gulp.task('html-dist', function(done){
  assetPath = assetCDN;
  feedPath = '';
  var translations = JSON.parse(fs.readFileSync('./src/_data/translations.json'));
  translations.forEach(function(item){
    return gulp.src(['./src/html/*.pug'])
        .pipe(data(function(file) {
            return item
        }))
        .pipe(data(function(){
            return {'assetPath': assetPath,'feedPath': feedPath}
        }))
        .pipe(pug({pretty:true}))
        .pipe(rename({suffix: '_'+item.version}))
        .pipe(gulp.dest('./dist'));
  })
  done()
});

// Static Server + watching files
gulp.task('serve', gulp.series('clean', gulp.series('html-tmp','assets','javascript','sass', function() {
    // browser-sync
    browserSync.init({
      server: {
        baseDir: "./tmp/",
        index: "index_en.html" // english version as default
      }
    });
    gulp.watch('./src/js/**/**.js', gulp.parallel('javascript')).on('change', browserSync.reload);
    gulp.watch('./src/css/**/*.scss', gulp.parallel('sass'));
    gulp.watch(['./src/**/*.pug','./src/_data/*.json'], gulp.parallel('html-tmp'));
})));

// serve
gulp.task('default', gulp.parallel('serve'));

// build
gulp.task('build', gulp.series( gulp.series('clean', gulp.series('html-dist','assets','javascript','sass')), function(done){
  done()
  // exit terminal process
  return process.exit(0);
}));


// deploy build
function getFilesFromPath(path, extension) {
    let dir = fs.readdirSync( path );
    return dir.filter( elm => elm.match(new RegExp(`.*\.(${extension})`, 'ig')));
}

function getElementsByText(str, tag = 'a') {
  return Array.prototype.slice.call(document.getElementsByTagName(tag)).filter(el => el.textContent.trim() === str.trim());
}

gulp.task('deploy', gulp.series( gulp.series('clean', gulp.series('html-dist','assets','javascript','sass')),function(done){

  var cssFile = './dist/css/global.css';
  var jsFile = './dist/js/main.js';
  var htmlFiles = getFilesFromPath('./dist', '.html')
  var CREDS = require('./deploy_creds');

  (async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(CREDS.deploy_url);
    await page.waitFor(2000);

    // login
    await page.click('#username');
    await page.keyboard.type(CREDS.username);
    await page.click('#password');
    await page.keyboard.type(CREDS.password);
    await page.click('.FF-button');
    await page.waitFor(3000);


    /*const rows = await page.evaluate(() => Array.from(document.querySelectorAll('[data-tstid="content-segment-description"]')));*/

   /* let rows = await page.$$eval('[data-tstid="content-segment-description"]');
    for (let row in rows){
      let text = await page.evaluate(el => el.textContent, row)
      console.log(text)
    }
*/
    // const startingCell = await page.$x('//*[text()[contains(., "CMS_US")]]'); // this works
    // const startingRow = await page.$x("//td[normalize-space(text())='CMS_US']/..");
    const startingRow = await page.$x("//td[normalize-space(text())='CMS_US']/..").then(function(result){//cc[../bb='zz']"
      console.log(result)
    }); // this works
    await page.waitFor(1000);
    //await console.log(startingRow)

    /*const copyButton = await startingRow.$('a.btn-info').then(function(result){
        console.log(result);
        result.click();
      }).catch( e => {
        console.log('XPath Error', e)
      });
    await page.waitFor(1000);*/


    // await console.log(rows[0])

    /*await rows.forEach(function(el){
      if (el.innerText === 'CMS_US') {
        console.log(el.innerText)
      }
    })*/



    // on deployment page, after login

    await htmlFiles.forEach(function(el){
      (async () => {
        // for each translation, perform deployment routine
        var version = el.toString();
        version = version.replace('index_','').replace('.html','');
        await page.waitFor(2000);



      })

    })

    // when done - confirmation messsage and close browser
    // await browser.close();

    // exit terminal process
    /*await done();
    await process.exit(0);*/

  })();


}));
