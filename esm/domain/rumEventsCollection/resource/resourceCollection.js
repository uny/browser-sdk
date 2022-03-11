import { combine, generateUUID, toServerDuration, relativeToClocks, assign, } from '@datadog/browser-core';
import { supportPerformanceEntry } from '../../../browser/performanceCollection';
import { matchRequestTiming } from './matchRequestTiming';
import { computePerformanceResourceDetails, computePerformanceResourceDuration, computeResourceKind, computeSize, isRequestKind, } from './resourceUtils';
export function startResourceCollection(lifeCycle) {
    lifeCycle.subscribe(8 /* REQUEST_COMPLETED */, function (request) {
        lifeCycle.notify(12 /* RAW_RUM_EVENT_COLLECTED */, processRequest(request));
    });
    lifeCycle.subscribe(0 /* PERFORMANCE_ENTRIES_COLLECTED */, function (entries) {
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            if (entry.entryType === 'resource' && !isRequestKind(entry)) {
                lifeCycle.notify(12 /* RAW_RUM_EVENT_COLLECTED */, processResourceEntry(entry));
            }
        }
    });
}
function processRequest(request) {
    var type = request.type === "xhr" /* XHR */ ? "xhr" /* XHR */ : "fetch" /* FETCH */;
    var matchingTiming = matchRequestTiming(request);
    var startClocks = matchingTiming ? relativeToClocks(matchingTiming.startTime) : request.startClocks;
    var correspondingTimingOverrides = matchingTiming ? computePerformanceEntryMetrics(matchingTiming) : undefined;
    var tracingInfo = computeRequestTracingInfo(request);
    var resourceEvent = combine({
        date: startClocks.timeStamp,
        resource: {
            id: generateUUID(),
            type: type,
            duration: toServerDuration(request.duration),
            method: request.method,
            status_code: request.status,
            url: request.url,
        },
        type: "resource" /* RESOURCE */,
    }, tracingInfo, correspondingTimingOverrides);
    return {
        startTime: startClocks.relative,
        rawRumEvent: resourceEvent,
        domainContext: {
            performanceEntry: matchingTiming && toPerformanceEntryRepresentation(matchingTiming),
            xhr: request.xhr,
            response: request.response,
            requestInput: request.input,
            requestInit: request.init,
            error: request.error,
        },
    };
}
function processResourceEntry(entry) {
    var type = computeResourceKind(entry);
    var entryMetrics = computePerformanceEntryMetrics(entry);
    var tracingInfo = computeEntryTracingInfo(entry);
    var startClocks = relativeToClocks(entry.startTime);
    var resourceEvent = combine({
        date: startClocks.timeStamp,
        resource: {
            id: generateUUID(),
            type: type,
            url: entry.name,
        },
        type: "resource" /* RESOURCE */,
    }, tracingInfo, entryMetrics);
    return {
        startTime: startClocks.relative,
        rawRumEvent: resourceEvent,
        domainContext: {
            performanceEntry: toPerformanceEntryRepresentation(entry),
        },
    };
}
function computePerformanceEntryMetrics(timing) {
    return {
        resource: assign({
            duration: computePerformanceResourceDuration(timing),
            size: computeSize(timing),
        }, computePerformanceResourceDetails(timing)),
    };
}
function computeRequestTracingInfo(request) {
    var hasBeenTraced = request.traceId && request.spanId;
    if (!hasBeenTraced) {
        return undefined;
    }
    return {
        _dd: {
            span_id: request.spanId.toDecimalString(),
            trace_id: request.traceId.toDecimalString(),
        },
    };
}
function computeEntryTracingInfo(entry) {
    return entry.traceId ? { _dd: { trace_id: entry.traceId } } : undefined;
}
function toPerformanceEntryRepresentation(entry) {
    if (supportPerformanceEntry() && entry instanceof PerformanceEntry) {
        entry.toJSON();
    }
    return entry;
}
//# sourceMappingURL=resourceCollection.js.map