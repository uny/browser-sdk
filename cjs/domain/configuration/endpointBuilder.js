"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEndpointBuilder = exports.INTAKE_SITE_US = exports.ENDPOINTS = void 0;
var timeUtils_1 = require("../../tools/timeUtils");
var urlPolyfill_1 = require("../../tools/urlPolyfill");
var utils_1 = require("../../tools/utils");
exports.ENDPOINTS = {
    logs: 'logs',
    rum: 'rum',
    sessionReplay: 'session-replay',
};
var INTAKE_TRACKS = {
    logs: 'logs',
    rum: 'rum',
    sessionReplay: 'replay',
};
exports.INTAKE_SITE_US = 'datadoghq.com';
function createEndpointBuilder(initConfiguration, endpointType, tags, source) {
    var _a = initConfiguration.site, site = _a === void 0 ? exports.INTAKE_SITE_US : _a, clientToken = initConfiguration.clientToken;
    var domainParts = site.split('.');
    var extension = domainParts.pop();
    var host = "".concat(exports.ENDPOINTS[endpointType], ".browser-intake-").concat(domainParts.join('-'), ".").concat(extension);
    var baseUrl = "https://".concat(host, "/api/v2/").concat(INTAKE_TRACKS[endpointType]);
    var proxyUrl = initConfiguration.proxyUrl && (0, urlPolyfill_1.normalizeUrl)(initConfiguration.proxyUrl);
    return {
        build: function () {
            var parameters = "ddsource=".concat(source || 'browser') +
                "&ddtags=".concat(encodeURIComponent(["sdk_version:".concat("dev")].concat(tags).join(','))) +
                "&dd-api-key=".concat(clientToken) +
                "&dd-evp-origin-version=".concat(encodeURIComponent("dev")) +
                '&dd-evp-origin=browser' +
                "&dd-request-id=".concat((0, utils_1.generateUUID)());
            if (endpointType === 'rum') {
                parameters += "&batch_time=".concat((0, timeUtils_1.timeStampNow)());
            }
            var endpointUrl = "".concat(baseUrl, "?").concat(parameters);
            return proxyUrl ? "".concat(proxyUrl, "?ddforward=").concat(encodeURIComponent(endpointUrl)) : endpointUrl;
        },
        buildIntakeUrl: function () {
            return proxyUrl ? "".concat(proxyUrl, "?ddforward") : baseUrl;
        },
    };
}
exports.createEndpointBuilder = createEndpointBuilder;
//# sourceMappingURL=endpointBuilder.js.map