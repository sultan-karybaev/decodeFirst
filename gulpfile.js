"use strict";

var gulp = require("gulp");

gulp.task("default", function () {
    return gulp.src("source/**/*.*")
        .on("data", function (file) {
            console.log({
                contents: file.contents,
                path: file.path,
                cwd: file.cwd,
                base: file.base,
                relative: file.relative,
                dirname: file.dirname,
                basename: file.basename,
                stem: file.stem,
                extname: file.extname
            });
        })
        .pipe(gulp.dest("dest"));
});