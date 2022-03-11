import { Batch, HttpRequest } from './index';
export function startBatchWithReplica(configuration, endpoint, replicaEndpoint) {
    var primaryBatch = createBatch(endpoint);
    var replicaBatch;
    if (replicaEndpoint) {
        replicaBatch = createBatch(replicaEndpoint);
    }
    function createBatch(endpointBuilder) {
        return new Batch(new HttpRequest(endpointBuilder, configuration.batchBytesLimit), configuration.maxBatchSize, configuration.batchBytesLimit, configuration.maxMessageSize, configuration.flushTimeout);
    }
    return {
        add: function (message) {
            primaryBatch.add(message);
            if (replicaBatch) {
                replicaBatch.add(message);
            }
        },
    };
}
//# sourceMappingURL=startBatchWithReplica.js.map