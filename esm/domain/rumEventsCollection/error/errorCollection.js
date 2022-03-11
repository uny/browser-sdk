import { assign, computeStackTrace, formatUnknownError, ErrorSource, generateUUID, Observable, trackRuntimeError, } from '@datadog/browser-core';
import { trackConsoleError } from './trackConsoleError';
import { trackReportError } from './trackReportError';
export function startErrorCollection(lifeCycle, foregroundContexts) {
    var errorObservable = new Observable();
    trackConsoleError(errorObservable);
    trackRuntimeError(errorObservable);
    trackReportError(errorObservable);
    errorObservable.subscribe(function (error) { return lifeCycle.notify(14 /* RAW_ERROR_COLLECTED */, { error: error }); });
    return doStartErrorCollection(lifeCycle, foregroundContexts);
}
export function doStartErrorCollection(lifeCycle, foregroundContexts) {
    lifeCycle.subscribe(14 /* RAW_ERROR_COLLECTED */, function (_a) {
        var error = _a.error, customerContext = _a.customerContext, savedCommonContext = _a.savedCommonContext;
        lifeCycle.notify(12 /* RAW_RUM_EVENT_COLLECTED */, assign({
            customerContext: customerContext,
            savedCommonContext: savedCommonContext,
        }, processError(error, foregroundContexts)));
    });
    return {
        addError: function (_a, savedCommonContext) {
            var error = _a.error, handlingStack = _a.handlingStack, startClocks = _a.startClocks, customerContext = _a.context;
            var rawError = computeRawError(error, handlingStack, startClocks);
            lifeCycle.notify(14 /* RAW_ERROR_COLLECTED */, {
                customerContext: customerContext,
                savedCommonContext: savedCommonContext,
                error: rawError,
            });
        },
    };
}
function computeRawError(error, handlingStack, startClocks) {
    var stackTrace = error instanceof Error ? computeStackTrace(error) : undefined;
    return assign({
        startClocks: startClocks,
        source: ErrorSource.CUSTOM,
        originalError: error,
        handling: "handled" /* HANDLED */,
    }, formatUnknownError(stackTrace, error, 'Provided', handlingStack));
}
function processError(error, foregroundContexts) {
    var rawRumEvent = {
        date: error.startClocks.timeStamp,
        error: {
            id: generateUUID(),
            message: error.message,
            source: error.source,
            stack: error.stack,
            handling_stack: error.handlingStack,
            type: error.type,
            handling: error.handling,
            source_type: 'browser',
        },
        type: "error" /* ERROR */,
    };
    var inForeground = foregroundContexts.isInForegroundAt(error.startClocks.relative);
    if (inForeground !== undefined) {
        rawRumEvent.view = { in_foreground: inForeground };
    }
    return {
        rawRumEvent: rawRumEvent,
        startTime: error.startClocks.relative,
        domainContext: {
            error: error.originalError,
        },
    };
}
//# sourceMappingURL=errorCollection.js.map