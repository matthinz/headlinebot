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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.scrapeArticlesPlugin = void 0;
var prettier_1 = __importDefault(require("prettier"));
var cheerio_1 = __importDefault(require("cheerio"));
var sanitize_html_1 = __importDefault(require("sanitize-html"));
var schema_1 = require("../schema");
var SCRAPERS = [
    {
        key: "content",
        selector: "article.story-body",
        reader: function ($el) {
            var _a;
            var html = ((_a = $el.html()) !== null && _a !== void 0 ? _a : "").trim();
            if (html === "") {
                return;
            }
            html = (0, sanitize_html_1["default"])(html);
            return prettier_1["default"].format(html, {
                parser: "html"
            });
        }
    },
    {
        key: "author",
        selector: "article.story-body .byline",
        reader: function ($el) {
            var _a;
            var names = ((_a = $el.text()) !== null && _a !== void 0 ? _a : "")
                .split("\n")
                .map(function (str) { return str.trim(); })
                .filter(Boolean)
                .map(function (name) { return name.replace(/^By\s*/i, ""); });
            if (names.length === 0) {
                return;
            }
            var uniqueNames = names.reduce(function (set, name) {
                set.add(name);
                return set;
            }, new Set());
            return Array.from(uniqueNames).join(", ");
        }
    },
];
function scrapeArticlesPlugin(_a) {
    var _this = this;
    var browser = _a.browser, logger = _a.logger;
    return function (state) { return __awaiter(_this, void 0, void 0, function () {
        var nextCache, promise, _a;
        var _b;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    promise = state.articles.reduce(function (promise, article) {
                        return promise.then(function (articles) { return __awaiter(_this, void 0, void 0, function () {
                            var html, cacheEntry, full;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        cacheEntry = state.cache.find(function (d) { return d.url === article.url.toString(); });
                                        if (!cacheEntry) return [3 /*break*/, 1];
                                        logger.debug("Loading %s from cache", article.url.toString());
                                        html = cacheEntry.body;
                                        return [3 /*break*/, 3];
                                    case 1: return [4 /*yield*/, browser.get(article.url)];
                                    case 2:
                                        html = _a.sent();
                                        nextCache = nextCache !== null && nextCache !== void 0 ? nextCache : __spreadArray([], state.cache, true);
                                        nextCache.push({
                                            date: new Date(),
                                            url: article.url.toString(),
                                            body: html
                                        });
                                        _a.label = 3;
                                    case 3:
                                        full = scrapeArticle(article, html);
                                        if (full) {
                                            articles.push(full);
                                        }
                                        else {
                                            articles.push(article);
                                        }
                                        return [2 /*return*/, articles];
                                }
                            });
                        }); });
                    }, Promise.resolve([]));
                    _a = [__assign({}, state)];
                    _b = {};
                    return [4 /*yield*/, promise];
                case 1: return [2 /*return*/, __assign.apply(void 0, _a.concat([(_b.articles = _c.sent(), _b.cache = nextCache !== null && nextCache !== void 0 ? nextCache : state.cache, _b)]))];
            }
        });
    }); };
}
exports.scrapeArticlesPlugin = scrapeArticlesPlugin;
function scrapeArticle(article, html) {
    var $ = cheerio_1["default"].load(html);
    var raw = SCRAPERS.reduce(function (raw, _a) {
        var key = _a.key, selector = _a.selector, reader = _a.reader;
        var $el = $(selector);
        var value = reader($el);
        if (value != null) {
            raw[key] = value;
        }
        return raw;
    }, __assign({}, article));
    var parsed = schema_1.ArticleSchema.safeParse(raw);
    if (parsed.success) {
        return parsed.data;
    }
    else {
        console.error(raw);
        console.error(parsed.error);
    }
}
