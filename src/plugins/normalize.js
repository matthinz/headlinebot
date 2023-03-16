"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.normalizePlugin = void 0;
var utils_1 = require("../utils");
function normalizePlugin(state) {
    var byId = {};
    state.articles.forEach(function (article) {
        var _a;
        byId[article.id] = (_a = byId[article.id]) !== null && _a !== void 0 ? _a : [];
        byId[article.id].push(article);
    });
    return Promise.resolve(__assign(__assign({}, state), { articles: Object.keys(byId).map(function (id) {
            var articles = byId[id];
            if (articles.length === 1) {
                return articles[0];
            }
            return merge(articles);
        }) }));
}
exports.normalizePlugin = normalizePlugin;
function merge(articles) {
    articles.sort(utils_1.oldestToNewestByDate);
    articles.reverse();
    var result = __assign({}, articles[0]);
    var _loop_1 = function (i) {
        Object.keys(articles[i]).forEach(function (key) {
            var _a;
            // @ts-ignore
            result[key] = (_a = result[key]) !== null && _a !== void 0 ? _a : articles[i][key];
        });
    };
    for (var i = 1; i < articles.length; i++) {
        _loop_1(i);
    }
    return result;
}
