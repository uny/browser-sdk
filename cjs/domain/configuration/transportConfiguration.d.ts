import type { InitConfiguration } from './configuration';
import type { EndpointBuilder } from './endpointBuilder';
export interface TransportConfiguration {
    logsEndpointBuilder: EndpointBuilder;
    rumEndpointBuilder: EndpointBuilder;
    sessionReplayEndpointBuilder: EndpointBuilder;
    internalMonitoringEndpointBuilder?: EndpointBuilder;
    isIntakeUrl: (url: string) => boolean;
    replica?: ReplicaConfiguration;
}
export interface ReplicaConfiguration {
    applicationId?: string;
    logsEndpointBuilder: EndpointBuilder;
    rumEndpointBuilder: EndpointBuilder;
    internalMonitoringEndpointBuilder: EndpointBuilder;
}
export declare function computeTransportConfiguration(initConfiguration: InitConfiguration): TransportConfiguration;
