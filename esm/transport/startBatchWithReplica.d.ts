import type { Configuration, EndpointBuilder } from '../domain/configuration';
import type { Context } from '../tools/context';
export declare function startBatchWithReplica<T extends Context>(configuration: Configuration, endpoint: EndpointBuilder, replicaEndpoint?: EndpointBuilder): {
    add(message: T): void;
};
