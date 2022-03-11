"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndBuildRumConfiguration = void 0;
var browser_core_1 = require("@datadog/browser-core");
function validateAndBuildRumConfiguration(initConfiguration) {
    var _a, _b;
    if (!initConfiguration.applicationId) {
        browser_core_1.display.error('Application ID is not configured, no RUM data will be collected.');
        return;
    }
    if (initConfiguration.replaySampleRate !== undefined && !(0, browser_core_1.isPercentage)(initConfiguration.replaySampleRate)) {
        browser_core_1.display.error('Replay Sample Rate should be a number between 0 and 100');
        return;
    }
    if (initConfiguration.allowedTracingOrigins !== undefined) {
        if (!Array.isArray(initConfiguration.allowedTracingOrigins)) {
            browser_core_1.display.error('Allowed Tracing Origins should be an array');
            return;
        }
        if (initConfiguration.allowedTracingOrigins.length !== 0 && initConfiguration.service === undefined) {
            browser_core_1.display.error('Service need to be configured when tracing is enabled');
            return;
        }
    }
    var baseConfiguration = (0, browser_core_1.validateAndBuildConfiguration)(initConfiguration);
    if (!baseConfiguration) {
        return;
    }
    return (0, browser_core_1.assign)({
        applicationId: initConfiguration.applicationId,
        actionNameAttribute: initConfiguration.actionNameAttribute,
        replaySampleRate: (_a = initConfiguration.replaySampleRate) !== null && _a !== void 0 ? _a : 100,
        allowedTracingOrigins: (_b = initConfiguration.allowedTracingOrigins) !== null && _b !== void 0 ? _b : [],
        trackInteractions: !!initConfiguration.trackInteractions,
        trackViewsManually: !!initConfiguration.trackViewsManually,
        defaultPrivacyLevel: (0, browser_core_1.objectHasValue)(browser_core_1.DefaultPrivacyLevel, initConfiguration.defaultPrivacyLevel)
            ? initConfiguration.defaultPrivacyLevel
            : browser_core_1.DefaultPrivacyLevel.MASK_USER_INPUT,
    }, baseConfiguration);
}
exports.validateAndBuildRumConfiguration = validateAndBuildRumConfiguration;
//# sourceMappingURL=configuration.js.map