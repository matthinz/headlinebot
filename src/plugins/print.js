"use strict";
exports.__esModule = true;
exports.printPlugin = void 0;
function printPlugin(articles) {
    articles.forEach(function (a) {
        console.log("# %s (%s)", a.title, a.url);
    });
    return Promise.resolve(articles);
}
exports.printPlugin = printPlugin;
