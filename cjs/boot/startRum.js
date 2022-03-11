"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRumEventCollection = exports.startRum = void 0;
var browser_core_1 = require("@datadog/browser-core");
var domMutationObservable_1 = require("../browser/domMutationObservable");
var performanceCollection_1 = require("../browser/performanceCollection");
var assembly_1 = require("../domain/assembly");
var foregroundContexts_1 = require("../domain/foregroundContexts");
var internalContext_1 = require("../domain/internalContext");
var lifeCycle_1 = require("../domain/lifeCycle");
var parentContexts_1 = require("../domain/parentContexts");
var requestCollection_1 = require("../domain/requestCollection");
var actionCollection_1 = require("../domain/rumEventsCollection/action/actionCollection");
var errorCollection_1 = require("../domain/rumEventsCollection/error/errorCollection");
var longTaskCollection_1 = require("../domain/rumEventsCollection/longTask/longTaskCollection");
var resourceCollection_1 = require("../domain/rumEventsCollection/resource/resourceCollection");
var viewCollection_1 = require("../domain/rumEventsCollection/view/viewCollection");
var rumSessionManager_1 = require("../domain/rumSessionManager");
var startRumBatch_1 = require("../transport/startRumBatch");
var startRumEventBridge_1 = require("../transport/startRumEventBridge");
var urlContexts_1 = require("../domain/urlContexts");
var locationChangeObservable_1 = require("../browser/locationChangeObservable");
function startRum(configuration, getCommonContext, recorderApi, initialViewName) {
    var lifeCycle = new lifeCycle_1.LifeCycle();
    var internalMonitoring = startRumInternalMonitoring(configuration);
    internalMonitoring.setExternalContextProvider(function () {
        var _a;
        return (0, browser_core_1.combine)({
            application_id: configuration.applicationId,
            session: {
                id: (_a = session.findTrackedSession()) === null || _a === void 0 ? void 0 : _a.id,
            },
        }, parentContexts.findView(), { view: { name: null } });
    });
    internalMonitoring.setTelemetryContextProvider(function () {
        var _a, _b, _c;
        return ({
            application: {
                id: configuration.applicationId,
            },
            session: {
                id: (_a = session.findTrackedSession()) === null || _a === void 0 ? void 0 : _a.id,
            },
            view: {
                id: (_b = parentContexts.findView()) === null || _b === void 0 ? void 0 : _b.view.id,
            },
            action: {
                id: (_c = parentContexts.findAction()) === null || _c === void 0 ? void 0 : _c.action.id,
            },
        });
    });
    if (!(0, browser_core_1.canUseEventBridge)()) {
        (0, startRumBatch_1.startRumBatch)(configuration, lifeCycle, internalMonitoring.telemetryEventObservable);
    }
    else {
        (0, startRumEventBridge_1.startRumEventBridge)(lifeCycle);
    }
    var session = !(0, browser_core_1.canUseEventBridge)() ? (0, rumSessionManager_1.startRumSessionManager)(configuration, lifeCycle) : (0, rumSessionManager_1.startRumSessionManagerStub)();
    var domMutationObservable = (0, domMutationObservable_1.createDOMMutationObservable)();
    var locationChangeObservable = (0, locationChangeObservable_1.createLocationChangeObservable)(location);
    var _a = startRumEventCollection(lifeCycle, configuration, location, session, locationChangeObservable, getCommonContext), parentContexts = _a.parentContexts, foregroundContexts = _a.foregroundContexts, urlContexts = _a.urlContexts;
    (0, longTaskCollection_1.startLongTaskCollection)(lifeCycle, session);
    (0, resourceCollection_1.startResourceCollection)(lifeCycle);
    var _b = (0, viewCollection_1.startViewCollection)(lifeCycle, configuration, location, domMutationObservable, locationChangeObservable, foregroundContexts, recorderApi, initialViewName), addTiming = _b.addTiming, startView = _b.startView;
    var addError = (0, errorCollection_1.startErrorCollection)(lifeCycle, foregroundContexts).addError;
    var addAction = (0, actionCollection_1.startActionCollection)(lifeCycle, domMutationObservable, configuration, foregroundContexts).addAction;
    (0, requestCollection_1.startRequestCollection)(lifeCycle, configuration, session);
    (0, performanceCollection_1.startPerformanceCollection)(lifeCycle, configuration);
    var internalContext = (0, internalContext_1.startInternalContext)(configuration.applicationId, session, parentContexts, urlContexts);
    return {
        addAction: addAction,
        addError: addError,
        addTiming: addTiming,
        startView: startView,
        lifeCycle: lifeCycle,
        parentContexts: parentContexts,
        session: session,
        getInternalContext: internalContext.get,
    };
}
exports.startRum = startRum;
function startRumInternalMonitoring(configuration) {
    var _a;
    var internalMonitoring = (0, browser_core_1.startInternalMonitoring)(configuration);
    if ((0, browser_core_1.canUseEventBridge)()) {
        var bridge_1 = (0, browser_core_1.getEventBridge)();
        internalMonitoring.monitoringMessageObservable.subscribe(function (message) { return bridge_1.send('internal_log', message); });
        internalMonitoring.telemetryEventObservable.subscribe(function (message) { return bridge_1.send('internal_telemetry', message); });
    }
    else if (configuration.internalMonitoringEndpointBuilder) {
        var batch_1 = (0, browser_core_1.startBatchWithReplica)(configuration, configuration.internalMonitoringEndpointBuilder, (_a = configuration.replica) === null || _a === void 0 ? void 0 : _a.internalMonitoringEndpointBuilder);
        internalMonitoring.monitoringMessageObservable.subscribe(function (message) { return batch_1.add(message); });
    }
    return internalMonitoring;
}
function startRumEventCollection(lifeCycle, configuration, location, sessionManager, locationChangeObservable, getCommonContext) {
    var parentContexts = (0, parentContexts_1.startParentContexts)(lifeCycle);
    var urlContexts = (0, urlContexts_1.startUrlContexts)(lifeCycle, locationChangeObservable, location);
    var foregroundContexts = (0, foregroundContexts_1.startForegroundContexts)();
    (0, assembly_1.startRumAssembly)(configuration, lifeCycle, sessionManager, parentContexts, urlContexts, getCommonContext);
    return {
        parentContexts: parentContexts,
        foregroundContexts: foregroundContexts,
        urlContexts: urlContexts,
        stop: function () {
            parentContexts.stop();
            foregroundContexts.stop();
        },
    };
}
exports.startRumEventCollection = startRumEventCollection;
//# sourceMappingURL=startRum.js.map