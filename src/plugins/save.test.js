"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var node_test_1 = require("node:test");
var node_assert_1 = __importDefault(require("node:assert"));
var save_1 = require("./save");
var load_1 = require("./load");
(0, node_test_1.describe)("#serializeState", function () {
    (0, node_test_1.it)("serializes dates", function () {
        var _a, _b;
        var testDate = new Date(2021, 1, 14, 15, 16, 17);
        var state = {
            articles: [
                {
                    id: "foo",
                    date: testDate,
                    metadata: {},
                    title: "Example",
                    url: "https://example.org/foo"
                },
            ],
            cache: [
                {
                    url: "https://example.org/foo",
                    date: testDate,
                    body: "hi",
                    status: 200
                },
            ]
        };
        var serialized = (0, save_1.serializeState)(state);
        var deserialized = (0, load_1.deserializeState)(serialized);
        node_assert_1["default"].strictEqual((_a = deserialized.articles[0].date) === null || _a === void 0 ? void 0 : _a.getTime(), testDate.getTime());
        node_assert_1["default"].strictEqual((_b = deserialized.cache[0].date) === null || _b === void 0 ? void 0 : _b.getTime(), testDate.getTime());
    });
});
