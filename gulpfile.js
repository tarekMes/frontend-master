const { src, dest, watch, series, parallel } = require("gulp");

const tslint = require("gulp-tslint"),
    cssnano = require("gulp-cssnano"),
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    sassLint = require("gulp-sass-lint"),
    ts = require("gulp-typescript"),
    uglify = require("gulp-uglify"),
    pug = require("gulp-pug"),
    rename = require("gulp-rename"),
    sass = require("gulp-sass")(require("sass")),
    browserSync = require("browser-sync"),
    reload = browserSync.reload,
    concat = require("gulp-concat");

sass.compiler = require("node-sass");

function ts_build() {
    return src("src/ts/**/*.ts")
        .pipe(
            tslint({
                formatter: "verbose",
            })
        )
        .pipe(tslint.report())
        .pipe(
            ts({
                noImplicitAny: true,
                outFile: "main.js",
            })
        )
        .pipe(uglify())
        .pipe(rename("main.min.js"))
        .pipe(dest("dist/javascript"));
}
function scss_build() {
    return src("src/sass/**/*.s+(a|c)ss")
        .pipe(sassLint({ configFile: "sass-lint.yml" }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
        .pipe(sass().on("error", sass.logError))
        .pipe(cssnano())
        .pipe(dest("dist/css"));
}

function pug_build() {
    return src("src/views/*.pug").pipe(pug()).pipe(dest("dist"));
}
function imagemin_build() {
    return src("src/img/**/*")
        .pipe(imagemin())
        .pipe(webp())
        .pipe(dest("dist/img"));
}
function serve_site(done) {
    // serve from current directory
    browserSync.init({
        server: {
            baseDir: "dist",
        },
    });
    //serve from domain
    // browserSync.init({
    //     proxy: "localhost/wordpress/" /* replace with your vhost domain name like sitename.sj*/
    // });
    done();
}

function browser_reload(done) {
    browserSync.reload();
    done();
}

function ts_watcher() {
    watch(["src/ts/**/*.ts"], series(ts_build, browser_reload));
}

function scss_watcher() {
    watch(["src/sass/**/*.scss"], series(scss_build, browser_reload));
}

function image_watcher() {
    watch(["src/img/**/*"], series(imagemin_build, browser_reload));
}

function pug_watcher() {
    watch(["src/views/**/*.pug"], series(pug_build, browser_reload));
}

exports.default = series(
    parallel(pug_build, ts_build, scss_build, imagemin_build),
    serve_site,
    parallel(pug_watcher, ts_watcher, scss_watcher, image_watcher)
);
