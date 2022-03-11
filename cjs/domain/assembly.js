"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRumAssembly = void 0;
var browser_core_1 = require("@datadog/browser-core");
var syntheticsContext_1 = require("./syntheticsContext");
var ciTestContext_1 = require("./ciTestContext");
var VIEW_EVENTS_MODIFIABLE_FIELD_PATHS = [
    // Fields with sensitive data
    'view.url',
    'view.referrer',
    'action.target.name',
    'error.message',
    'error.stack',
    'error.resource.url',
    'resource.url',
];
var OTHER_EVENTS_MODIFIABLE_FIELD_PATHS = VIEW_EVENTS_MODIFIABLE_FIELD_PATHS.concat([
    // User-customizable field
    'context',
]);
function startRumAssembly(configuration, lifeCycle, sessionManager, parentContexts, urlContexts, getCommonContext) {
    var _a;
    var reportError = function (error) {
        lifeCycle.notify(14 /* RAW_ERROR_COLLECTED */, { error: error });
    };
    var eventRateLimiters = (_a = {},
        _a["error" /* ERROR */] = (0, browser_core_1.createEventRateLimiter)("error" /* ERROR */, configuration.eventRateLimiterThreshold, reportError),
        _a["action" /* ACTION */] = (0, browser_core_1.createEventRateLimiter)("action" /* ACTION */, configuration.eventRateLimiterThreshold, reportError),
        _a);
    var syntheticsContext = (0, syntheticsContext_1.getSyntheticsContext)();
    var ciTestContext = (0, ciTestContext_1.getCiTestContext)();
    lifeCycle.subscribe(12 /* RAW_RUM_EVENT_COLLECTED */, function (_a) {
        var startTime = _a.startTime, rawRumEvent = _a.rawRumEvent, domainContext = _a.domainContext, savedCommonContext = _a.savedCommonContext, customerContext = _a.customerContext;
        var viewContext = parentContexts.findView(startTime);
        var urlContext = urlContexts.findUrl(startTime);
        // allow to send events if the session was tracked when they start
        // except for views which are continuously updated
        // TODO: stop sending view updates when session is expired
        var session = sessionManager.findTrackedSession(rawRumEvent.type !== "view" /* VIEW */ ? startTime : undefined);
        if (session && viewContext && urlContext) {
            var actionContext = parentContexts.findAction(startTime);
            var commonContext = savedCommonContext || getCommonContext();
            var rumContext = {
                _dd: {
                    format_version: 2,
                    drift: (0, browser_core_1.currentDrift)(),
                    session: {
                        plan: session.hasReplayPlan ? 2 /* REPLAY */ : 1 /* LITE */,
                    },
                    browser_sdk_version: (0, browser_core_1.canUseEventBridge)() ? "dev" : undefined,
                },
                application: {
                    id: configuration.applicationId,
                },
                date: (0, browser_core_1.timeStampNow)(),
                service: configuration.service,
                source: 'browser',
                session: {
                    id: session.id,
                    type: syntheticsContext ? "synthetics" /* SYNTHETICS */ : ciTestContext ? "ci_test" /* CI_TEST */ : "user" /* USER */,
                },
                synthetics: syntheticsContext,
                ci_test: ciTestContext,
            };
            var serverRumEvent = (needToAssembleWithAction(rawRumEvent)
                ? (0, browser_core_1.combine)(rumContext, urlContext, viewContext, actionContext, rawRumEvent)
                : (0, browser_core_1.combine)(rumContext, urlContext, viewContext, rawRumEvent));
            serverRumEvent.context = (0, browser_core_1.combine)(commonContext.context, customerContext);
            if (!('has_replay' in serverRumEvent.session)) {
                ;
                serverRumEvent.session.has_replay = commonContext.hasReplay;
            }
            if (!(0, browser_core_1.isEmptyObject)(commonContext.user)) {
                ;
                serverRumEvent.usr = commonContext.user;
            }
            if (shouldSend(serverRumEvent, configuration.beforeSend, domainContext, eventRateLimiters)) {
                if ((0, browser_core_1.isEmptyObject)(serverRumEvent.context)) {
                    delete serverRumEvent.context;
                }
                lifeCycle.notify(13 /* RUM_EVENT_COLLECTED */, serverRumEvent);
            }
        }
    });
}
exports.startRumAssembly = startRumAssembly;
function shouldSend(event, beforeSend, domainContext, eventRateLimiters) {
    var _a;
    if (beforeSend) {
        var result = (0, browser_core_1.limitModification)(event, event.type === "view" /* VIEW */ ? VIEW_EVENTS_MODIFIABLE_FIELD_PATHS : OTHER_EVENTS_MODIFIABLE_FIELD_PATHS, function (event) { return beforeSend(event, domainContext); });
        if (result === false && event.type !== "view" /* VIEW */) {
            return false;
        }
        if (result === false) {
            browser_core_1.display.warn("Can't dismiss view events using beforeSend!");
        }
    }
    var rateLimitReached = (_a = eventRateLimiters[event.type]) === null || _a === void 0 ? void 0 : _a.isLimitReached();
    return !rateLimitReached;
}
function needToAssembleWithAction(event) {
    return ["error" /* ERROR */, "resource" /* RESOURCE */, "long_task" /* LONG_TASK */].indexOf(event.type) !== -1;
}
//# sourceMappingURL=assembly.js.map