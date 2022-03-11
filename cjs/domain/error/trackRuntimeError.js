"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackRuntimeError = void 0;
var error_1 = require("../../tools/error");
var timeUtils_1 = require("../../tools/timeUtils");
var tracekit_1 = require("../tracekit");
function trackRuntimeError(errorObservable) {
    return (0, tracekit_1.startUnhandledErrorCollection)(function (stackTrace, errorObject) {
        var _a = (0, error_1.formatUnknownError)(stackTrace, errorObject, 'Uncaught'), stack = _a.stack, message = _a.message, type = _a.type;
        errorObservable.notify({
            message: message,
            stack: stack,
            type: type,
            source: error_1.ErrorSource.SOURCE,
            startClocks: (0, timeUtils_1.clocksNow)(),
            originalError: errorObject,
            handling: "unhandled" /* UNHANDLED */,
        });
    });
}
exports.trackRuntimeError = trackRuntimeError;
//# sourceMappingURL=trackRuntimeError.js.map