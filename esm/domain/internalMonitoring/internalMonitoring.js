import { display } from '../../tools/display';
import { toStackTraceString } from '../../tools/error';
import { assign, combine, jsonStringify } from '../../tools/utils';
import { computeStackTrace } from '../tracekit';
import { Observable } from '../../tools/observable';
import { timeStampNow } from '../../tools/timeUtils';
import { isExperimentalFeatureEnabled } from '../configuration';
var monitoringConfiguration = { maxMessagesPerPage: 0, sentMessageCount: 0 };
var onInternalMonitoringMessageCollected;
export function startInternalMonitoring(configuration) {
    var externalContextProvider;
    var telemetryContextProvider;
    var monitoringMessageObservable = new Observable();
    var telemetryEventObservable = new Observable();
    onInternalMonitoringMessageCollected = function (message) {
        monitoringMessageObservable.notify(withContext(message));
        if (isExperimentalFeatureEnabled('telemetry')) {
            telemetryEventObservable.notify(toTelemetryEvent(message));
        }
    };
    assign(monitoringConfiguration, {
        maxMessagesPerPage: configuration.maxInternalMonitoringMessagesPerPage,
        sentMessageCount: 0,
    });
    function withContext(message) {
        return combine({ date: timeStampNow() }, externalContextProvider !== undefined ? externalContextProvider() : {}, message);
    }
    function toTelemetryEvent(message) {
        return combine({
            date: timeStampNow(),
            service: 'browser-sdk',
            version: "dev",
            _dd: {
                event_type: 'internal_telemetry',
            },
        }, telemetryContextProvider !== undefined ? telemetryContextProvider() : {}, message);
    }
    return {
        setExternalContextProvider: function (provider) {
            externalContextProvider = provider;
        },
        monitoringMessageObservable: monitoringMessageObservable,
        setTelemetryContextProvider: function (provider) {
            telemetryContextProvider = provider;
        },
        telemetryEventObservable: telemetryEventObservable,
    };
}
export function startFakeInternalMonitoring() {
    var messages = [];
    assign(monitoringConfiguration, {
        maxMessagesPerPage: Infinity,
        sentMessageCount: 0,
    });
    onInternalMonitoringMessageCollected = function (message) {
        messages.push(message);
    };
    return messages;
}
export function resetInternalMonitoring() {
    onInternalMonitoringMessageCollected = undefined;
}
export function monitored(_, __, descriptor) {
    var originalMethod = descriptor.value;
    descriptor.value = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var decorated = onInternalMonitoringMessageCollected ? monitor(originalMethod) : originalMethod;
        return decorated.apply(this, args);
    };
}
export function monitor(fn) {
    return function () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return callMonitored(fn, this, arguments);
    }; // consider output type has input type
}
export function callMonitored(fn, context, args) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return fn.apply(context, args);
    }
    catch (e) {
        logErrorIfDebug(e);
        try {
            addMonitoringError(e);
        }
        catch (e) {
            logErrorIfDebug(e);
        }
    }
}
export function addMonitoringMessage(message, context) {
    logMessageIfDebug(message, context);
    addToMonitoring(assign({
        message: message,
        status: "debug" /* debug */,
    }, context));
}
export function addMonitoringError(e) {
    addToMonitoring(assign({
        status: "error" /* error */,
    }, formatError(e)));
}
function addToMonitoring(message) {
    if (onInternalMonitoringMessageCollected &&
        monitoringConfiguration.sentMessageCount < monitoringConfiguration.maxMessagesPerPage) {
        monitoringConfiguration.sentMessageCount += 1;
        onInternalMonitoringMessageCollected(message);
    }
}
function formatError(e) {
    if (e instanceof Error) {
        var stackTrace = computeStackTrace(e);
        return {
            error: {
                kind: stackTrace.name,
                stack: toStackTraceString(stackTrace),
            },
            message: stackTrace.message,
        };
    }
    return {
        error: {
            stack: 'Not an instance of error',
        },
        message: "Uncaught ".concat(jsonStringify(e)),
    };
}
export function setDebugMode(debugMode) {
    monitoringConfiguration.debugMode = debugMode;
}
function logErrorIfDebug(e) {
    if (monitoringConfiguration.debugMode) {
        display.error('[INTERNAL ERROR]', e);
    }
}
function logMessageIfDebug(message, context) {
    if (monitoringConfiguration.debugMode) {
        display.log('[MONITORING MESSAGE]', message, context);
    }
}
//# sourceMappingURL=internalMonitoring.js.map