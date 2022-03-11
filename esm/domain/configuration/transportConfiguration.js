import { assign, objectValues } from '../../tools/utils';
import { createEndpointBuilder, INTAKE_SITE_US } from './endpointBuilder';
import { buildTags } from './tags';
export function computeTransportConfiguration(initConfiguration) {
    var tags = buildTags(initConfiguration);
    var endpointBuilders = computeEndpointBuilders(initConfiguration, tags);
    var intakeEndpoints = objectValues(endpointBuilders).map(function (builder) { return builder.buildIntakeUrl(); });
    var replicaConfiguration = computeReplicaConfiguration(initConfiguration, intakeEndpoints, tags);
    return assign({
        isIntakeUrl: function (url) { return intakeEndpoints.some(function (intakeEndpoint) { return url.indexOf(intakeEndpoint) === 0; }); },
        replica: replicaConfiguration,
    }, endpointBuilders);
}
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
        logsEndpointBuilder: createEndpointBuilder(initConfiguration, 'logs', tags),
        rumEndpointBuilder: createEndpointBuilder(initConfiguration, 'rum', tags),
        sessionReplayEndpointBuilder: createEndpointBuilder(initConfiguration, 'sessionReplay', tags),
    };
    if (initConfiguration.internalMonitoringApiKey) {
        return assign(endpointBuilders, {
            internalMonitoringEndpointBuilder: createEndpointBuilder(assign({}, initConfiguration, { clientToken: initConfiguration.internalMonitoringApiKey }), 'logs', tags, 'browser-agent-internal-monitoring'),
        });
    }
    return endpointBuilders;
}
function computeReplicaConfiguration(initConfiguration, intakeEndpoints, tags) {
    if (!initConfiguration.replica) {
        return;
    }
    var replicaConfiguration = assign({}, initConfiguration, {
        site: INTAKE_SITE_US,
        clientToken: initConfiguration.replica.clientToken,
    });
    var replicaEndpointBuilders = {
        logsEndpointBuilder: createEndpointBuilder(replicaConfiguration, 'logs', tags),
        rumEndpointBuilder: createEndpointBuilder(replicaConfiguration, 'rum', tags),
        internalMonitoringEndpointBuilder: createEndpointBuilder(replicaConfiguration, 'logs', tags, 'browser-agent-internal-monitoring'),
    };
    intakeEndpoints.push.apply(intakeEndpoints, objectValues(replicaEndpointBuilders).map(function (builder) { return builder.buildIntakeUrl(); }));
    return assign({ applicationId: initConfiguration.replica.applicationId }, replicaEndpointBuilders);
}
//# sourceMappingURL=transportConfiguration.js.map