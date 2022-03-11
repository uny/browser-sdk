import { callMonitored } from '../internalMonitoring';
import { computeStackTrace } from '../tracekit';
import { createHandlingStack, formatErrorMessage, toStackTraceString } from '../../tools/error';
import { mergeObservables, Observable } from '../../tools/observable';
import { find, jsonStringify } from '../../tools/utils';
export var ConsoleApiName = {
    log: 'log',
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
};
var consoleObservablesByApi = {};
export function initConsoleObservable(apis) {
    var consoleObservables = apis.map(function (api) {
        if (!consoleObservablesByApi[api]) {
            consoleObservablesByApi[api] = createConsoleObservable(api);
        }
        return consoleObservablesByApi[api];
    });
    return mergeObservables.apply(void 0, consoleObservables);
}
/* eslint-disable no-console */
function createConsoleObservable(api) {
    var observable = new Observable(function () {
        var originalConsoleApi = console[api];
        console[api] = function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            originalConsoleApi.apply(console, params);
            var handlingStack = createHandlingStack();
            callMonitored(function () {
                observable.notify(buildConsoleLog(params, api, handlingStack));
            });
        };
        return function () {
            console[api] = originalConsoleApi;
        };
    });
    return observable;
}
function buildConsoleLog(params, api, handlingStack) {
    var log = {
        message: ["console ".concat(api, ":")]
            .concat(params)
            .map(function (param) { return formatConsoleParameters(param); })
            .join(' '),
        api: api,
    };
    if (api === ConsoleApiName.error) {
        var firstErrorParam = find(params, function (param) { return param instanceof Error; });
        log.stack = firstErrorParam ? toStackTraceString(computeStackTrace(firstErrorParam)) : undefined;
        log.handlingStack = handlingStack;
    }
    return log;
}
function formatConsoleParameters(param) {
    if (typeof param === 'string') {
        return param;
    }
    if (param instanceof Error) {
        return formatErrorMessage(computeStackTrace(param));
    }
    return jsonStringify(param, undefined, 2);
}
//# sourceMappingURL=consoleObservable.js.map