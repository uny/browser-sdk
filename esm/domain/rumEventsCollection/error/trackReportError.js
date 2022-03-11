import { clocksNow, ErrorSource, initReportObservable, RawReportType, isExperimentalFeatureEnabled, noop, } from '@datadog/browser-core';
export function trackReportError(errorObservable) {
    if (!isExperimentalFeatureEnabled('forward-reports')) {
        return {
            stop: noop,
        };
    }
    var subscription = initReportObservable([RawReportType.cspViolation, RawReportType.intervention]).subscribe(function (reportError) {
        return errorObservable.notify({
            startClocks: clocksNow(),
            message: reportError.message,
            stack: reportError.stack,
            type: reportError.subtype,
            source: ErrorSource.REPORT,
            handling: "unhandled" /* UNHANDLED */,
        });
    });
    return {
        stop: function () {
            subscription.unsubscribe();
        },
    };
}
//# sourceMappingURL=trackReportError.js.map