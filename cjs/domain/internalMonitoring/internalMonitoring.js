"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDebugMode = exports.addMonitoringError = exports.addMonitoringMessage = exports.callMonitored = exports.monitor = exports.monitored = exports.resetInternalMonitoring = exports.startFakeInternalMonitoring = exports.startInternalMonitoring = void 0;
var display_1 = require("../../tools/display");
var error_1 = require("../../tools/error");
var utils_1 = require("../../tools/utils");
var tracekit_1 = require("../tracekit");
var observable_1 = require("../../tools/observable");
var timeUtils_1 = require("../../tools/timeUtils");
var configuration_1 = require("../configuration");
var monitoringConfiguration = { maxMessagesPerPage: 0, sentMessageCount: 0 };
var onInternalMonitoringMessageCollected;
function startInternalMonitoring(configuration) {
    var externalContextProvider;
    var telemetryContextProvider;
    var monitoringMessageObservable = new observable_1.Observable();
    var telemetryEventObservable = new observable_1.Observable();
    onInternalMonitoringMessageCollected = function (message) {
        monitoringMessageObservable.notify(withContext(message));
        if ((0, configuration_1.isExperimentalFeatureEnabled)('telemetry')) {
            telemetryEventObservable.notify(toTelemetryEvent(message));
        }
    };
    (0, utils_1.assign)(monitoringConfiguration, {
        maxMessagesPerPage: configuration.maxInternalMonitoringMessagesPerPage,
        sentMessageCount: 0,
    });
    function withContext(message) {
        return (0, utils_1.combine)({ date: (0, timeUtils_1.timeStampNow)() }, externalContextProvider !== undefined ? externalContextProvider() : {}, message);
    }
    function toTelemetryEvent(message) {
        return (0, utils_1.combine)({
            date: (0, timeUtils_1.timeStampNow)(),
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
exports.startInternalMonitoring = startInternalMonitoring;
function startFakeInternalMonitoring() {
    var messages = [];
    (0, utils_1.assign)(monitoringConfiguration, {
        maxMessagesPerPage: Infinity,
        sentMessageCount: 0,
    });
    onInternalMonitoringMessageCollected = function (message) {
        messages.push(message);
    };
    return messages;
}
exports.startFakeInternalMonitoring = startFakeInternalMonitoring;
function resetInternalMonitoring() {
    onInternalMonitoringMessageCollected = undefined;
}
exports.resetInternalMonitoring = resetInternalMonitoring;
function monitored(_, __, descriptor) {
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
exports.monitored = monitored;
function monitor(fn) {
    return function () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return callMonitored(fn, this, arguments);
    }; // consider output type has input type
}
exports.monitor = monitor;
function callMonitored(fn, context, args) {
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
exports.callMonitored = callMonitored;
function addMonitoringMessage(message, context) {
    logMessageIfDebug(message, context);
    addToMonitoring((0, utils_1.assign)({
        message: message,
        status: "debug" /* debug */,
    }, context));
}
exports.addMonitoringMessage = addMonitoringMessage;
function addMonitoringError(e) {
    addToMonitoring((0, utils_1.assign)({
        status: "error" /* error */,
    }, formatError(e)));
}
exports.addMonitoringError = addMonitoringError;
function addToMonitoring(message) {
    if (onInternalMonitoringMessageCollected &&
        monitoringConfiguration.sentMessageCount < monitoringConfiguration.maxMessagesPerPage) {
        monitoringConfiguration.sentMessageCount += 1;
        onInternalMonitoringMessageCollected(message);
    }
}
function formatError(e) {
    if (e instanceof Error) {
        var stackTrace = (0, tracekit_1.computeStackTrace)(e);
        return {
            error: {
                kind: stackTrace.name,
                stack: (0, error_1.toStackTraceString)(stackTrace),
            },
            message: stackTrace.message,
        };
    }
    return {
        error: {
            stack: 'Not an instance of error',
        },
        message: "Uncaught ".concat((0, utils_1.jsonStringify)(e)),
    };
}
function setDebugMode(debugMode) {
    monitoringConfiguration.debugMode = debugMode;
}
exports.setDebugMode = setDebugMode;
function logErrorIfDebug(e) {
    if (monitoringConfiguration.debugMode) {
        display_1.display.error('[INTERNAL ERROR]', e);
    }
}
function logMessageIfDebug(message, context) {
    if (monitoringConfiguration.debugMode) {
        display_1.display.log('[MONITORING MESSAGE]', message, context);
    }
}
//# sourceMappingURL=internalMonitoring.js.map