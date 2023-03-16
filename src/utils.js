"use strict";
exports.__esModule = true;
exports.delay = exports.oldestToNewestByDate = void 0;
function oldestToNewestByDate(a, b) {
    if (!a.date && !b.date) {
        return 0;
    }
    else if (!a.date) {
        return -1;
    }
    else if (!b.date) {
        return 1;
    }
    else if (a.date < b.date) {
        return -1;
    }
    else if (a.date > b.date) {
        return 1;
    }
    else {
        return 0;
    }
}
exports.oldestToNewestByDate = oldestToNewestByDate;
function delay(minOrExact, max) {
    var duration = max == null ? minOrExact : minOrExact + Math.random() * (max - minOrExact);
    return new Promise(function (resolve) { return setTimeout(resolve, duration); });
}
exports.delay = delay;
