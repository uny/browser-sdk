import { assign, addEventListeners, elapsed, ONE_MINUTE, find, findLast } from '@datadog/browser-core';
import { trackFirstHidden } from './trackFirstHidden';
// Discard LCP and FCP timings above a certain delay to avoid incorrect data
// It happens in some cases like sleep mode or some browser implementations
export var TIMING_MAXIMUM_DELAY = 10 * ONE_MINUTE;
export function trackInitialViewTimings(lifeCycle, callback) {
    var timings = {};
    function setTimings(newTimings) {
        assign(timings, newTimings);
        callback(timings);
    }
    var stopNavigationTracking = trackNavigationTimings(lifeCycle, setTimings).stop;
    var stopFCPTracking = trackFirstContentfulPaintTiming(lifeCycle, function (firstContentfulPaint) {
        return setTimings({ firstContentfulPaint: firstContentfulPaint });
    }).stop;
    var stopLCPTracking = trackLargestContentfulPaintTiming(lifeCycle, window, function (largestContentfulPaint) {
        setTimings({
            largestContentfulPaint: largestContentfulPaint,
        });
    }).stop;
    var stopFIDTracking = trackFirstInputTimings(lifeCycle, function (_a) {
        var firstInputDelay = _a.firstInputDelay, firstInputTime = _a.firstInputTime;
        setTimings({
            firstInputDelay: firstInputDelay,
            firstInputTime: firstInputTime,
        });
    }).stop;
    return {
        stop: function () {
            stopNavigationTracking();
            stopFCPTracking();
            stopLCPTracking();
            stopFIDTracking();
        },
    };
}
export function trackNavigationTimings(lifeCycle, callback) {
    var stop = lifeCycle.subscribe(0 /* PERFORMANCE_ENTRIES_COLLECTED */, function (entries) {
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            if (entry.entryType === 'navigation') {
                callback({
                    domComplete: entry.domComplete,
                    domContentLoaded: entry.domContentLoadedEventEnd,
                    domInteractive: entry.domInteractive,
                    loadEvent: entry.loadEventEnd,
                });
            }
        }
    }).unsubscribe;
    return { stop: stop };
}
export function trackFirstContentfulPaintTiming(lifeCycle, callback) {
    var firstHidden = trackFirstHidden();
    var stop = lifeCycle.subscribe(0 /* PERFORMANCE_ENTRIES_COLLECTED */, function (entries) {
        var fcpEntry = find(entries, function (entry) {
            return entry.entryType === 'paint' &&
                entry.name === 'first-contentful-paint' &&
                entry.startTime < firstHidden.timeStamp &&
                entry.startTime < TIMING_MAXIMUM_DELAY;
        });
        if (fcpEntry) {
            callback(fcpEntry.startTime);
        }
    }).unsubscribe;
    return { stop: stop };
}
/**
 * Track the largest contentful paint (LCP) occurring during the initial View.  This can yield
 * multiple values, only the most recent one should be used.
 * Documentation: https://web.dev/lcp/
 * Reference implementation: https://github.com/GoogleChrome/web-vitals/blob/master/src/getLCP.ts
 */
export function trackLargestContentfulPaintTiming(lifeCycle, emitter, callback) {
    var firstHidden = trackFirstHidden();
    // Ignore entries that come after the first user interaction.  According to the documentation, the
    // browser should not send largest-contentful-paint entries after a user interact with the page,
    // but the web-vitals reference implementation uses this as a safeguard.
    var firstInteractionTimestamp = Infinity;
    var stopEventListener = addEventListeners(emitter, ["pointerdown" /* POINTER_DOWN */, "keydown" /* KEY_DOWN */], function (event) {
        firstInteractionTimestamp = event.timeStamp;
    }, { capture: true, once: true }).stop;
    var unsubscribeLifeCycle = lifeCycle.subscribe(0 /* PERFORMANCE_ENTRIES_COLLECTED */, function (entries) {
        var lcpEntry = findLast(entries, function (entry) {
            return entry.entryType === 'largest-contentful-paint' &&
                entry.startTime < firstInteractionTimestamp &&
                entry.startTime < firstHidden.timeStamp &&
                entry.startTime < TIMING_MAXIMUM_DELAY;
        });
        if (lcpEntry) {
            callback(lcpEntry.startTime);
        }
    }).unsubscribe;
    return {
        stop: function () {
            stopEventListener();
            unsubscribeLifeCycle();
        },
    };
}
/**
 * Track the first input occurring during the initial View to return:
 * - First Input Delay
 * - First Input Time
 * Callback is called at most one time.
 * Documentation: https://web.dev/fid/
 * Reference implementation: https://github.com/GoogleChrome/web-vitals/blob/master/src/getFID.ts
 */
export function trackFirstInputTimings(lifeCycle, callback) {
    var firstHidden = trackFirstHidden();
    var stop = lifeCycle.subscribe(0 /* PERFORMANCE_ENTRIES_COLLECTED */, function (entries) {
        var firstInputEntry = find(entries, function (entry) {
            return entry.entryType === 'first-input' && entry.startTime < firstHidden.timeStamp;
        });
        if (firstInputEntry) {
            var firstInputDelay = elapsed(firstInputEntry.startTime, firstInputEntry.processingStart);
            callback({
                // Ensure firstInputDelay to be positive, see
                // https://bugs.chromium.org/p/chromium/issues/detail?id=1185815
                firstInputDelay: firstInputDelay >= 0 ? firstInputDelay : 0,
                firstInputTime: firstInputEntry.startTime,
            });
        }
    }).unsubscribe;
    return {
        stop: stop,
    };
}
//# sourceMappingURL=trackInitialViewTimings.js.map