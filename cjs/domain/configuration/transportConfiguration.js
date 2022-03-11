"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTransportConfiguration = void 0;
var utils_1 = require("../../tools/utils");
var endpointBuilder_1 = require("./endpointBuilder");
var tags_1 = require("./tags");
function computeTransportConfiguration(initConfiguration) {
    var tags = (0, tags_1.buildTags)(initConfiguration);
    var endpointBuilders = computeEndpointBuilders(initConfiguration, tags);
    var intakeEndpoints = (0, utils_1.objectValues)(endpointBuilders).map(function (builder) { return builder.buildIntakeUrl(); });
    var replicaConfiguration = computeReplicaConfiguration(initConfiguration, intakeEndpoints, tags);
    return (0, utils_1.assign)({
        isIntakeUrl: function (url) { return intakeEndpoints.some(function (intakeEndpoint) { return url.indexOf(intakeEndpoint) === 0; }); },
        replica: replicaConfiguration,
    }, endpointBuilders);
}
exports.computeTransportConfiguration = computeTransportConfiguration;
function computeEndpointBuilders(initConfiguration, tags) {
    if ("dev" === 'e2e-test') {
        var e2eEndpointBuilder = function (placeholder) { return ({
            build: function () { return placeholder; },
            buildIntakeUrl: function () { return placeholder; },
        }); };
        return {
            logsEndpointBuilder: e2eEndpointBuilder('<<< E2E LOGS ENDPOINT >>>'),
            rumEndpointBuilder: e2eEndpointBuilder('<<< E2E RUM ENDPOINT >>>'),
            sessionReplayEndpointBuilder: e2eEndpointBuilder('<<< E2E SESSION REPLAY ENDPOINT >>>'),
            internalMonitoringEndpointBuilder: e2eEndpointBuilder('<<< E2E INTERNAL MONITORING ENDPOINT >>>'),
        };
    }
    var endpointBuilders = {
        logsEndpointBuilder: (0, endpointBuilder_1.createEndpointBuilder)(initConfiguration, 'logs', tags),
        rumEndpointBuilder: (0, endpointBuilder_1.createEndpointBuilder)(initConfiguration, 'rum', tags),
        sessionReplayEndpointBuilder: (0, endpointBuilder_1.createEndpointBuilder)(initConfiguration, 'sessionReplay', tags),
    };
    if (initConfiguration.internalMonitoringApiKey) {
        return (0, utils_1.assign)(endpointBuilders, {
            internalMonitoringEndpointBuilder: (0, endpointBuilder_1.createEndpointBuilder)((0, utils_1.assign)({}, initConfiguration, { clientToken: initConfiguration.internalMonitoringApiKey }), 'logs', tags, 'browser-agent-internal-monitoring'),
        });
    }
    return endpointBuilders;
}
function computeReplicaConfiguration(initConfiguration, intakeEndpoints, tags) {
    if (!initConfiguration.replica) {
        return;
    }
    var replicaConfiguration = (0, utils_1.assign)({}, initConfiguration, {
        site: endpointBuilder_1.INTAKE_SITE_US,
        clientToken: initConfiguration.replica.clientToken,
    });
    var replicaEndpointBuilders = {
        logsEndpointBuilder: (0, endpointBuilder_1.createEndpointBuilder)(replicaConfiguration, 'logs', tags),
        rumEndpointBuilder: (0, endpointBuilder_1.createEndpointBuilder)(replicaConfiguration, 'rum', tags),
        internalMonitoringEndpointBuilder: (0, endpointBuilder_1.createEndpointBuilder)(replicaConfiguration, 'logs', tags, 'browser-agent-internal-monitoring'),
    };
    intakeEndpoints.push.apply(intakeEndpoints, (0, utils_1.objectValues)(replicaEndpointBuilders).map(function (builder) { return builder.buildIntakeUrl(); }));
    return (0, utils_1.assign)({ applicationId: initConfiguration.replica.applicationId }, replicaEndpointBuilders);
}
//# sourceMappingURL=transportConfiguration.js.map