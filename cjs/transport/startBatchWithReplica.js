"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBatchWithReplica = void 0;
var index_1 = require("./index");
function startBatchWithReplica(configuration, endpoint, replicaEndpoint) {
    var primaryBatch = createBatch(endpoint);
    var replicaBatch;
    if (replicaEndpoint) {
        replicaBatch = createBatch(replicaEndpoint);
    }
    function createBatch(endpointBuilder) {
        return new index_1.Batch(new index_1.HttpRequest(endpointBuilder, configuration.batchBytesLimit), configuration.maxBatchSize, configuration.batchBytesLimit, configuration.maxMessageSize, configuration.flushTimeout);
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
exports.startBatchWithReplica = startBatchWithReplica;
//# sourceMappingURL=startBatchWithReplica.js.map