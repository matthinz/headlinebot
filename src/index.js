"use strict";
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
exports.__esModule = true;
var dotenv_1 = require("dotenv");
var scrape_articles_1 = require("./plugins/scrape-articles");
var load_1 = require("./plugins/load");
var save_1 = require("./plugins/save");
var scrape_headlines_1 = require("./plugins/scrape-headlines");
var browser_1 = require("./browser");
var logger_1 = require("./logger");
var utils_1 = require("./utils");
var normalize_1 = require("./plugins/normalize");
var summarize_1 = require("./plugins/summarize");
var slack_1 = require("./plugins/slack");
run(process.argv.slice(2))["catch"](function (err) {
    console.error(err);
    process.exitCode = 1;
});
function run(args) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        function executePipeline(plugins, initialState) {
            return __awaiter(this, void 0, void 0, function () {
                function next(newState) {
                    return __awaiter(this, void 0, void 0, function () {
                        var plugin, pluginResult, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    state = newState ? newState : state;
                                    _b.label = 1;
                                case 1:
                                    if (!(nextPlugins.length > 0)) return [3 /*break*/, 5];
                                    plugin = nextPlugins.shift();
                                    if (!plugin) {
                                        return [3 /*break*/, 1];
                                    }
                                    pluginResult = plugin(state, next);
                                    if (!(pluginResult instanceof Promise)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, pluginResult];
                                case 2:
                                    _a = _b.sent();
                                    return [3 /*break*/, 4];
                                case 3:
                                    _a = pluginResult;
                                    _b.label = 4;
                                case 4:
                                    state = _a;
                                    return [3 /*break*/, 1];
                                case 5: return [2 /*return*/, state];
                            }
                        });
                    });
                }
                var state, nextPlugins;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            state = initialState;
                            nextPlugins = __spreadArray([], plugins, true);
                            return [4 /*yield*/, next()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        }
        var logger, headlinesUrl, browser, shouldScrapeHeadlines, plugins, initialState, state;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    (0, dotenv_1.config)();
                    logger = (0, logger_1.createConsoleLogger)({
                        verbose: !!process.env.VERBOSE || args.includes("--verbose")
                    });
                    headlinesUrl = new URL((_a = process.env.HEADLINES_URL) !== null && _a !== void 0 ? _a : "");
                    return [4 /*yield*/, (0, browser_1.launchBrowser)({
                            allowedHosts: __spreadArray([
                                headlinesUrl.hostname
                            ], ((_b = process.env.ALLOWED_HOSTS) !== null && _b !== void 0 ? _b : "")
                                .split(",")
                                .map(function (host) { return host.trim(); })
                                .filter(Boolean), true),
                            logger: logger,
                            onPageLoad: handlePageLoad
                        })];
                case 1:
                    browser = _c.sent();
                    shouldScrapeHeadlines = !args.includes("--no-scrape");
                    plugins = [
                        load_1.loadPlugin,
                        shouldScrapeHeadlines &&
                            (0, scrape_headlines_1.scrapeHeadlinesPlugin)({
                                browser: browser,
                                url: headlinesUrl
                            }),
                        normalize_1.normalizePlugin,
                        (0, scrape_articles_1.scrapeArticlesPlugin)({
                            browser: browser,
                            logger: logger
                        }),
                        (0, summarize_1.summarizePlugin)({ logger: logger }),
                        save_1.savePlugin,
                    ].filter(Boolean);
                    if (process.env.SLACK_CHANNEL && process.env.SLACK_TOKEN) {
                        plugins.push((0, slack_1.slackPlugin)({
                            channel: process.env.SLACK_CHANNEL,
                            token: process.env.SLACK_TOKEN
                        }));
                    }
                    initialState = {
                        articles: [],
                        cache: []
                    };
                    return [4 /*yield*/, executePipeline(plugins, initialState)];
                case 2:
                    state = _c.sent();
                    return [4 /*yield*/, browser.close()];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handlePageLoad(page) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var isPaywall, username, password;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.evaluate(function () {
                        var _a;
                        var title = document.querySelector(".page-title");
                        return ((_a = title === null || title === void 0 ? void 0 : title.innerText) === null || _a === void 0 ? void 0 : _a.trim()) === "Subscribe to continue reading";
                    })];
                case 1:
                    isPaywall = _c.sent();
                    if (!isPaywall) {
                        return [2 /*return*/];
                    }
                    // Find the login link and click it
                    return [4 /*yield*/, page.click("#account-signin-btn")];
                case 2:
                    // Find the login link and click it
                    _c.sent();
                    username = (_a = process.env["WEBSITE_USERNAME"]) !== null && _a !== void 0 ? _a : "";
                    password = (_b = process.env["WEBSITE_PASSWORD"]) !== null && _b !== void 0 ? _b : "";
                    return [4 /*yield*/, page.waitForSelector("input[name=email]")];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, utils_1.delay)(1000, 3000)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, page.focus("input[name=email]")];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, (0, utils_1.delay)(500, 1000)];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, page.type("input[name=email]", username, {
                            delay: Math.random() * 100
                        })];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, page.focus("input[name=password]")];
                case 8:
                    _c.sent();
                    return [4 /*yield*/, (0, utils_1.delay)(500, 1000)];
                case 9:
                    _c.sent();
                    return [4 /*yield*/, page.type("input[name=password]", password, {
                            delay: Math.random() * 100
                        })];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, page.click("button[type=submit]")];
                case 11:
                    _c.sent();
                    return [4 /*yield*/, page.waitForNavigation()];
                case 12:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
