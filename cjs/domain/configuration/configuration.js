"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCookieOptions = exports.validateAndBuildConfiguration = exports.DefaultPrivacyLevel = void 0;
var cookie_1 = require("../../browser/cookie");
var catchUserErrors_1 = require("../../tools/catchUserErrors");
var display_1 = require("../../tools/display");
var utils_1 = require("../../tools/utils");
var experimentalFeatures_1 = require("./experimentalFeatures");
var transportConfiguration_1 = require("./transportConfiguration");
exports.DefaultPrivacyLevel = {
    ALLOW: 'allow',
    MASK: 'mask',
    MASK_USER_INPUT: 'mask-user-input',
};
function validateAndBuildConfiguration(initConfiguration) {
    var _a;
    if (!initConfiguration || !initConfiguration.clientToken) {
        display_1.display.error('Client Token is not configured, we will not send any data.');
        return;
    }
    if (initConfiguration.sampleRate !== undefined && !(0, utils_1.isPercentage)(initConfiguration.sampleRate)) {
        display_1.display.error('Sample Rate should be a number between 0 and 100');
        return;
    }
    // Set the experimental feature flags as early as possible, so we can use them in most places
    (0, experimentalFeatures_1.updateExperimentalFeatures)(initConfiguration.enableExperimentalFeatures);
    return (0, utils_1.assign)({
        beforeSend: initConfiguration.beforeSend && (0, catchUserErrors_1.catchUserErrors)(initConfiguration.beforeSend, 'beforeSend threw an error:'),
        cookieOptions: buildCookieOptions(initConfiguration),
        sampleRate: (_a = initConfiguration.sampleRate) !== null && _a !== void 0 ? _a : 100,
        service: initConfiguration.service,
        silentMultipleInit: !!initConfiguration.silentMultipleInit,
        /**
         * beacon payload max queue size implementation is 64kb
         * ensure that we leave room for logs, rum and potential other users
         */
        batchBytesLimit: 16 * utils_1.ONE_KILO_BYTE,
        eventRateLimiterThreshold: 3000,
        maxInternalMonitoringMessagesPerPage: 15,
        /**
         * flush automatically, aim to be lower than ALB connection timeout
         * to maximize connection reuse.
         */
        flushTimeout: 30 * utils_1.ONE_SECOND,
        /**
         * Logs intake limit
         */
        maxBatchSize: 50,
        maxMessageSize: 256 * utils_1.ONE_KILO_BYTE,
    }, (0, transportConfiguration_1.computeTransportConfiguration)(initConfiguration));
}
exports.validateAndBuildConfiguration = validateAndBuildConfiguration;
function buildCookieOptions(initConfiguration) {
    var cookieOptions = {};
    cookieOptions.secure = mustUseSecureCookie(initConfiguration);
    cookieOptions.crossSite = !!initConfiguration.useCrossSiteSessionCookie;
    if (initConfiguration.trackSessionAcrossSubdomains) {
        cookieOptions.domain = (0, cookie_1.getCurrentSite)();
    }
    return cookieOptions;
}
exports.buildCookieOptions = buildCookieOptions;
function mustUseSecureCookie(initConfiguration) {
    return !!initConfiguration.useSecureSessionCookie || !!initConfiguration.useCrossSiteSessionCookie;
}
//# sourceMappingURL=configuration.js.map