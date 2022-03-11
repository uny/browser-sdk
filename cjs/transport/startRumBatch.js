"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRumBatch = void 0;
var browser_core_1 = require("@datadog/browser-core");
function startRumBatch(configuration, lifeCycle, telemetryEventObservable) {
    var batch = makeRumBatch(configuration, lifeCycle);
    lifeCycle.subscribe(13 /* RUM_EVENT_COLLECTED */, function (serverRumEvent) {
        if (serverRumEvent.type === "view" /* VIEW */) {
            batch.upsert(serverRumEvent, serverRumEvent.view.id);
        }
        else {
            batch.add(serverRumEvent);
        }
    });
    telemetryEventObservable.subscribe(function (event) { return batch.add(event); });
}
exports.startRumBatch = startRumBatch;
function makeRumBatch(configuration, lifeCycle) {
    var primaryBatch = createRumBatch(configuration.rumEndpointBuilder, function () {
        return lifeCycle.notify(11 /* BEFORE_UNLOAD */);
    });
    var replicaBatch;
    var replica = configuration.replica;
    if (replica !== undefined) {
        replicaBatch = createRumBatch(replica.rumEndpointBuilder);
    }
    function createRumBatch(endpointBuilder, unloadCallback) {
        return new browser_core_1.Batch(new browser_core_1.HttpRequest(endpointBuilder, configuration.batchBytesLimit), configuration.maxBatchSize, configuration.batchBytesLimit, configuration.maxMessageSize, configuration.flushTimeout, unloadCallback);
    }
    function withReplicaApplicationId(message) {
        return (0, browser_core_1.combine)(message, { application: { id: replica.applicationId } });
    }
    return {
        add: function (message) {
            primaryBatch.add(message);
            if (replicaBatch) {
                replicaBatch.add(withReplicaApplicationId(message));
            }
        },
        upsert: function (message, key) {
            primaryBatch.upsert(message, key);
            if (replicaBatch) {
                replicaBatch.upsert(withReplicaApplicationId(message), key);
            }
        },
    };
}
//# sourceMappingURL=startRumBatch.js.map