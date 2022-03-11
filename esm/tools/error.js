import { callMonitored } from '../domain/internalMonitoring';
import { computeStackTrace } from '../domain/tracekit';
import { jsonStringify, noop } from './utils';
export var ErrorSource = {
    AGENT: 'agent',
    CONSOLE: 'console',
    CUSTOM: 'custom',
    LOGGER: 'logger',
    NETWORK: 'network',
    SOURCE: 'source',
    REPORT: 'report',
};
export function formatUnknownError(stackTrace, errorObject, nonErrorPrefix, handlingStack) {
    if (!stackTrace || (stackTrace.message === undefined && !(errorObject instanceof Error))) {
        return {
            message: "".concat(nonErrorPrefix, " ").concat(jsonStringify(errorObject)),
            stack: 'No stack, consider using an instance of Error',
            handlingStack: handlingStack,
            type: stackTrace && stackTrace.name,
        };
    }
    return {
        message: stackTrace.message || 'Empty message',
        stack: toStackTraceString(stackTrace),
        handlingStack: handlingStack,
        type: stackTrace.name,
    };
}
export function toStackTraceString(stack) {
    var result = formatErrorMessage(stack);
    stack.stack.forEach(function (frame) {
        var func = frame.func === '?' ? '<anonymous>' : frame.func;
        var args = frame.args && frame.args.length > 0 ? "(".concat(frame.args.join(', '), ")") : '';
        var line = frame.line ? ":".concat(frame.line) : '';
        var column = frame.line && frame.column ? ":".concat(frame.column) : '';
        result += "\n  at ".concat(func).concat(args, " @ ").concat(frame.url).concat(line).concat(column);
    });
    return result;
}
export function getFileFromStackTraceString(stack) {
    var _a;
    return (_a = /@ (.+)/.exec(stack)) === null || _a === void 0 ? void 0 : _a[1];
}
export function formatErrorMessage(stack) {
    return "".concat(stack.name || 'Error', ": ").concat(stack.message);
}
/**
 Creates a stacktrace without SDK internal frames.
 
 Constraints:
 - Has to be called at the utmost position of the call stack.
 - No internal monitoring should encapsulate the function, that is why we need to use callMonitored inside of it.
 */
export function createHandlingStack() {
    /**
     * Skip the two internal frames:
     * - SDK API (console.error, ...)
     * - this function
     * in order to keep only the user calls
     */
    var internalFramesToSkip = 2;
    var error = new Error();
    var formattedStack;
    // IE needs to throw the error to fill in the stack trace
    if (!error.stack) {
        try {
            throw error;
        }
        catch (e) {
            noop();
        }
    }
    callMonitored(function () {
        var stackTrace = computeStackTrace(error);
        stackTrace.stack = stackTrace.stack.slice(internalFramesToSkip);
        formattedStack = toStackTraceString(stackTrace);
    });
    return formattedStack;
}
//# sourceMappingURL=error.js.map