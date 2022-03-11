import { performDraw, startSessionManager } from '@datadog/browser-core';
export var RUM_SESSION_KEY = 'rum';
export function startRumSessionManager(configuration, lifeCycle) {
    var sessionManager = startSessionManager(configuration.cookieOptions, RUM_SESSION_KEY, function (rawTrackingType) {
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
/**
 * Start a tracked replay session stub
 * It needs to be a replay plan in order to get long tasks
 */
export function startRumSessionManagerStub() {
    var session = {
        id: '00000000-aaaa-0000-aaaa-000000000000',
        hasReplayPlan: true,
        hasLitePlan: false,
    };
    return {
        findTrackedSession: function () { return session; },
    };
}
function computeSessionState(configuration, rawTrackingType) {
    var trackingType;
    if (hasValidRumSession(rawTrackingType)) {
        trackingType = rawTrackingType;
    }
    else if (!performDraw(configuration.sampleRate)) {
        trackingType = "0" /* NOT_TRACKED */;
    }
    else if (!performDraw(configuration.replaySampleRate)) {
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