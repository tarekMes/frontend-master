const { src, dest, watch, series, parallel } = require("gulp");
const { FALSE } = require("node-sass");

const tslint = require("gulp-tslint"),
    cssnano = require("gulp-cssnano"),
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    sassLint = require("gulp-sass-lint"),
    ts = require("gulp-typescript"),
    uglify = require("gulp-uglify-es").default,
    sourcemaps = require("gulp-sourcemaps"),
    pug = require("gulp-pug"),
    rename = require("gulp-rename"),
    sass = require("gulp-sass")(require("sass")),
    browserSync = require("browser-sync"),
    reload = browserSync.reload,
    concat = require("gulp-concat"),
    ttf2woff = require("gulp-ttf2woff2"),
    consolidate = require("gulp-consolidate"),
    iconfont = require("gulp-iconfont"),
    iconfontCss = require("gulp-iconfont-css");

var runTimestamp = Math.round(Date.now() / 1000);
sass.compiler = require("node-sass");

function build_font_icon() {
    return src("src/icons/*.svg")
        .pipe(
            iconfontCss({
                fontName: "myfont",
            })
        )
        .pipe(
            iconfont({
                fontName: "myfont", // required
                prependUnicode: true, // recommended option
                formats: ["ttf", "eot", "woff"], // default, 'woff2' and 'svg' are available
                timestamp: runTimestamp, // recommended to get consistent builds when watching files
            })
        )
        .on("glyphs", function (glyphs, options) {
            console.log(glyphs, options);
        })
        .pipe(dest("dist/fonts/"));
}

function build_font() {
    return src("src/fonts/*.ttf").pipe(ttf2woff()).pipe(dest("dist/fonts"));
}

function ts_build() {
    return (
        src("src/ts/**/*.ts")
            .pipe(
                tslint({
                    formatter: "verbose",
                })
            )
            .pipe(tslint.report())
            .pipe(
                ts({
                    noImplicitAny: true,
                    module: "es6",
                    target: "ES6",
                    removeComments: true,
                })
            )
            // .pipe(
            //     rename({
            //         suffix: ".min",
            //     })
            // )
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(sourcemaps.write("./maps"))
            .pipe(dest("dist/javascript"))
    );
}
function scss_build() {
    return src("src/sass/*.s+(a|c)ss")
        .pipe(sassLint({ configFile: "sass-lint.yml" }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError())
        .pipe(sass().on("error", sass.logError))
        .pipe(
            rename({
                suffix: ".min",
            })
        )
        .pipe(sourcemaps.init())
        .pipe(cssnano())
        .pipe(sourcemaps.write("./maps"))
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

function svg_watcher() {
    watch(["src/icons/*.svg"], series(build_font_icon));
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
    parallel(
        build_font,
        build_font_icon,
        pug_build,
        ts_build,
        scss_build,
        imagemin_build
    ),
    serve_site,
    parallel(svg_watcher, pug_watcher, ts_watcher, scss_watcher, image_watcher)
);
