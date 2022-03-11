import { combine, isEmptyObject, limitModification, timeStampNow, currentDrift, display, createEventRateLimiter, canUseEventBridge, } from '@datadog/browser-core';
import { getSyntheticsContext } from './syntheticsContext';
import { getCiTestContext } from './ciTestContext';
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
export function startRumAssembly(configuration, lifeCycle, sessionManager, parentContexts, urlContexts, getCommonContext) {
    var _a;
    var reportError = function (error) {
        lifeCycle.notify(14 /* RAW_ERROR_COLLECTED */, { error: error });
    };
    var eventRateLimiters = (_a = {},
        _a["error" /* ERROR */] = createEventRateLimiter("error" /* ERROR */, configuration.eventRateLimiterThreshold, reportError),
        _a["action" /* ACTION */] = createEventRateLimiter("action" /* ACTION */, configuration.eventRateLimiterThreshold, reportError),
        _a);
    var syntheticsContext = getSyntheticsContext();
    var ciTestContext = getCiTestContext();
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
                    drift: currentDrift(),
                    session: {
                        plan: session.hasReplayPlan ? 2 /* REPLAY */ : 1 /* LITE */,
                    },
                    browser_sdk_version: canUseEventBridge() ? "dev" : undefined,
                },
                application: {
                    id: configuration.applicationId,
                },
                date: timeStampNow(),
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
                ? combine(rumContext, urlContext, viewContext, actionContext, rawRumEvent)
                : combine(rumContext, urlContext, viewContext, rawRumEvent));
            serverRumEvent.context = combine(commonContext.context, customerContext);
            if (!('has_replay' in serverRumEvent.session)) {
                ;
                serverRumEvent.session.has_replay = commonContext.hasReplay;
            }
            if (!isEmptyObject(commonContext.user)) {
                ;
                serverRumEvent.usr = commonContext.user;
            }
            if (shouldSend(serverRumEvent, configuration.beforeSend, domainContext, eventRateLimiters)) {
                if (isEmptyObject(serverRumEvent.context)) {
                    delete serverRumEvent.context;
                }
                lifeCycle.notify(13 /* RUM_EVENT_COLLECTED */, serverRumEvent);
            }
        }
    });
}
function shouldSend(event, beforeSend, domainContext, eventRateLimiters) {
    var _a;
    if (beforeSend) {
        var result = limitModification(event, event.type === "view" /* VIEW */ ? VIEW_EVENTS_MODIFIABLE_FIELD_PATHS : OTHER_EVENTS_MODIFIABLE_FIELD_PATHS, function (event) { return beforeSend(event, domainContext); });
        if (result === false && event.type !== "view" /* VIEW */) {
            return false;
        }
        if (result === false) {
            display.warn("Can't dismiss view events using beforeSend!");
        }
    }
    var rateLimitReached = (_a = eventRateLimiters[event.type]) === null || _a === void 0 ? void 0 : _a.isLimitReached();
    return !rateLimitReached;
}
function needToAssembleWithAction(event) {
    return ["error" /* ERROR */, "resource" /* RESOURCE */, "long_task" /* LONG_TASK */].indexOf(event.type) !== -1;
}
//# sourceMappingURL=assembly.js.map