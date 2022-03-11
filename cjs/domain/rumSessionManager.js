"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRumSessionManagerStub = exports.startRumSessionManager = exports.RUM_SESSION_KEY = void 0;
var browser_core_1 = require("@datadog/browser-core");
exports.RUM_SESSION_KEY = 'rum';
function startRumSessionManager(configuration, lifeCycle) {
    var sessionManager = (0, browser_core_1.startSessionManager)(configuration.cookieOptions, exports.RUM_SESSION_KEY, function (rawTrackingType) {
        return computeSessionState(configuration, rawTrackingType);
    });
    sessionManager.expireObservable.subscribe(function () {
        lifeCycle.notify(9 /* SESSION_EXPIRED */);
    });
    sessionManager.renewObservable.subscribe(function () {
        lifeCycle.notify(10 /* SESSION_RENEWED */);
    });
    return {
        findTrackedSession: function (startTime) {
            var session = sessionManager.findActiveSession(startTime);
            if (!session || !isTypeTracked(session.trackingType)) {
                return;
            }
            return {
                id: session.id,
                hasReplayPlan: session.trackingType === "1" /* TRACKED_REPLAY */,
                hasLitePlan: session.trackingType === "2" /* TRACKED_LITE */,
            };
        },
    };
}
exports.startRumSessionManager = startRumSessionManager;
/**
 * Start a tracked replay session stub
 * It needs to be a replay plan in order to get long tasks
 */
function startRumSessionManagerStub() {
    var session = {
        id: '00000000-aaaa-0000-aaaa-000000000000',
        hasReplayPlan: true,
        hasLitePlan: false,
    };
    return {
        findTrackedSession: function () { return session; },
    };
}
exports.startRumSessionManagerStub = startRumSessionManagerStub;
function computeSessionState(configuration, rawTrackingType) {
    var trackingType;
    if (hasValidRumSession(rawTrackingType)) {
        trackingType = rawTrackingType;
    }
    else if (!(0, browser_core_1.performDraw)(configuration.sampleRate)) {
        trackingType = "0" /* NOT_TRACKED */;
    }
    else if (!(0, browser_core_1.performDraw)(configuration.replaySampleRate)) {
        trackingType = "2" /* TRACKED_LITE */;
    }
    else {
        trackingType = "1" /* TRACKED_REPLAY */;
    }
    return {
        trackingType: trackingType,
        isTracked: isTypeTracked(trackingType),
    };
}
function hasValidRumSession(trackingType) {
    return (trackingType === "0" /* NOT_TRACKED */ ||
        trackingType === "1" /* TRACKED_REPLAY */ ||
        trackingType === "2" /* TRACKED_LITE */);
}
function isTypeTracked(rumSessionType) {
    return rumSessionType === "2" /* TRACKED_LITE */ || rumSessionType === "1" /* TRACKED_REPLAY */;
}
//# sourceMappingURL=rumSessionManager.js.map