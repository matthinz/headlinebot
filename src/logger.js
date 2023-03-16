"use strict";
exports.__esModule = true;
exports.createConsoleLogger = void 0;
var node_util_1 = require("node:util");
function createConsoleLogger(_a) {
    var _b = _a.out, out = _b === void 0 ? process.stdout : _b, _c = _a.err, err = _c === void 0 ? process.stderr : _c, verbose = _a.verbose;
    var logger = {
        debug: debug,
        info: info
    };
    return logger;
    function debug() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (verbose) {
            err.write(node_util_1.format.apply(void 0, args));
            err.write("\n");
        }
        return logger;
    }
    function info() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        out.write(node_util_1.format.apply(void 0, args));
        out.write("\n");
        return logger;
    }
}
exports.createConsoleLogger = createConsoleLogger;
