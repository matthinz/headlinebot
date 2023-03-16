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
exports.__esModule = true;
exports.slackPlugin = void 0;
var date_fns_1 = require("date-fns");
var web_api_1 = require("@slack/web-api");
var utils_1 = require("../utils");
function slackPlugin(_a) {
    var _this = this;
    var channel = _a.channel, token = _a.token;
    var client = new web_api_1.WebClient(token);
    return function (state) { return __awaiter(_this, void 0, void 0, function () {
        var oldestToNewest;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, __spreadArray([], state.articles, true).sort(utils_1.oldestToNewestByDate)
                        .reduce(function (promise, article) {
                        return promise.then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if ((_a = article.metadata) === null || _a === void 0 ? void 0 : _a.postedToSlackAt) {
                                            console.error("Not posting %s -- posted to slack at %s", article.id, article.metadata.postedToSlackAt);
                                            result.push(article);
                                            return [2 /*return*/, result];
                                        }
                                        return [4 /*yield*/, client.chat.postMessage({
                                                channel: channel,
                                                text: article.title,
                                                // @ts-ignore
                                                blocks: articleToBlocks(article),
                                                unfurl_links: false
                                            })];
                                    case 1:
                                        _c.sent();
                                        result.push(__assign(__assign({}, article), { metadata: __assign(__assign({}, ((_b = article === null || article === void 0 ? void 0 : article.metadata) !== null && _b !== void 0 ? _b : {})), { postedToSlackAt: new Date().toISOString() }) }));
                                        return [2 /*return*/, result];
                                }
                            });
                        }); });
                    }, Promise.resolve([]))];
                case 1:
                    oldestToNewest = _a.sent();
                    return [2 /*return*/, __assign(__assign({}, state), { articles: state.articles
                                .map(function (_a) {
                                var id = _a.id;
                                return oldestToNewest.find(function (a) { return a.id === id; });
                            })
                                .filter(Boolean) })];
            }
        });
    }); };
}
exports.slackPlugin = slackPlugin;
function articleToBlocks(article) {
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*".concat(article.title, "*")
            }
        },
        (article.date || article.author) && {
            type: "context",
            elements: [
                article.date && {
                    type: "plain_text",
                    text: (0, date_fns_1.formatRelative)(article.date, new Date())
                },
                article.author && {
                    type: "plain_text",
                    text: article.author
                },
            ].filter(Boolean)
        },
        article.summary && {
            type: "section",
            text: {
                type: "plain_text",
                text: article.summary,
                emoji: false
            }
        },
    ].filter(Boolean);
}
