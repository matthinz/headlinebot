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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.launchBrowser = void 0;
var promises_1 = __importDefault(require("node:fs/promises"));
var puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
var puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
puppeteer_extra_1["default"].use((0, puppeteer_extra_plugin_stealth_1["default"])());
function launchBrowser(_a) {
    var _b;
    var allowedHosts = _a.allowedHosts, logger = _a.logger, onPageLoad = _a.onPageLoad;
    return __awaiter(this, void 0, void 0, function () {
        function close() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, saveCookies(page)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, browser.close()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        function get(url) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, page.goto(url.toString())];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, onPageLoad(page)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, page.evaluate(function () { return document.documentElement.outerHTML; })];
                        case 3: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        }
        function shouldBlockRequest(requestUrl) {
            return !allowedHosts.includes(requestUrl.hostname);
        }
        var browser, page, _c, blockedHosts;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, puppeteer_extra_1["default"].launch({
                        headless: false,
                        defaultViewport: null,
                        executablePath: process.env.CHROME_PATH
                    })];
                case 1:
                    browser = _d.sent();
                    return [4 /*yield*/, browser.pages()];
                case 2:
                    if (!((_b = (_d.sent())[0]) !== null && _b !== void 0)) return [3 /*break*/, 3];
                    _c = _b;
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, browser.newPage()];
                case 4:
                    _c = (_d.sent());
                    _d.label = 5;
                case 5:
                    page = _c;
                    blockedHosts = new Set();
                    page.emulateTimezone("America/Los_Angeles");
                    page.setRequestInterception(true);
                    page.on("request", function (request) {
                        var requestUrl = new URL(request.url());
                        if (shouldBlockRequest(requestUrl)) {
                            if (!blockedHosts.has(requestUrl.hostname)) {
                                logger.debug("Blocking request to %s", requestUrl.hostname);
                                blockedHosts.add(requestUrl.hostname);
                            }
                            request.abort();
                        }
                        else {
                            request["continue"]();
                        }
                    });
                    return [4 /*yield*/, restoreCookies(page)];
                case 6:
                    _d.sent();
                    return [2 /*return*/, { close: close, get: get }];
            }
        });
    });
}
exports.launchBrowser = launchBrowser;
function restoreCookies(page, cookiesFile) {
    if (cookiesFile === void 0) { cookiesFile = ".cookies.json"; }
    return __awaiter(this, void 0, void 0, function () {
        var cookies, _a, _b, err_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, promises_1["default"].readFile(cookiesFile, "utf-8")];
                case 1:
                    cookies = _b.apply(_a, [_c.sent()]);
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _c.sent();
                    if (err_1.code !== "ENOENT") {
                        throw err_1;
                    }
                    return [3 /*break*/, 3];
                case 3: return [4 /*yield*/, page.setCookie.apply(page, cookies)];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function saveCookies(page, cookiesFile) {
    if (cookiesFile === void 0) { cookiesFile = ".cookies.json"; }
    return __awaiter(this, void 0, void 0, function () {
        var cookies;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.cookies()];
                case 1:
                    cookies = _a.sent();
                    return [4 /*yield*/, promises_1["default"].writeFile(cookiesFile, JSON.stringify(cookies, null, 2))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
