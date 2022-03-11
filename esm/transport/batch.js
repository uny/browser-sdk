import { display, objectValues } from '@datadog/browser-core';
// eslint-disable-next-line no-control-regex
var HAS_MULTI_BYTES_CHARACTERS = /[^\u0000-\u007F]/;
var Batch = /** @class */ (function () {
    function Batch(request, maxSize, bytesLimit, maxMessageSize, flushTimeout) {
        this.request = request;
        this.maxSize = maxSize;
        this.bytesLimit = bytesLimit;
        this.maxMessageSize = maxMessageSize;
        this.flushTimeout = flushTimeout;
        this.pushOnlyBuffer = [];
        this.upsertBuffer = {};
        this.bufferBytesSize = 0;
        this.bufferMessageCount = 0;
        this.flushPeriodically();
    }
    Batch.prototype.add = function (message) {
        this.addOrUpdate(message);
    };
    Batch.prototype.upsert = function (message, key) {
        this.addOrUpdate(message, key);
    };
    Batch.prototype.flush = function (reason) {
        if (this.bufferMessageCount !== 0) {
            var messages = this.pushOnlyBuffer.concat(objectValues(this.upsertBuffer));
            this.request.send(messages.join('\n'), reason);
            this.pushOnlyBuffer = [];
            this.upsertBuffer = {};
            this.bufferBytesSize = 0;
            this.bufferMessageCount = 0;
        }
    };
    Batch.prototype.sizeInBytes = function (candidate) {
        // Accurate byte size computations can degrade performances when there is a lot of events to process
        if (!HAS_MULTI_BYTES_CHARACTERS.test(candidate)) {
            return candidate.length;
        }
        if (window.TextEncoder !== undefined) {
            return new TextEncoder().encode(candidate).length;
        }
        return new Blob([candidate]).size;
    };
    Batch.prototype.addOrUpdate = function (message, key) {
        var _a = this.process(message), processedMessage = _a.processedMessage, messageBytesSize = _a.messageBytesSize;
        if (messageBytesSize >= this.maxMessageSize) {
            display.warn("Discarded a message whose size was bigger than the maximum allowed size ".concat(this.maxMessageSize, "KB."));
            return;
        }
        if (this.hasMessageFor(key)) {
            this.remove(key);
        }
        if (this.willReachedBytesLimitWith(messageBytesSize)) {
            this.flush('willReachedBytesLimitWith');
        }
        this.push(processedMessage, messageBytesSize, key);
        if (this.isFull()) {
            this.flush('isFull');
        }
    };
    Batch.prototype.process = function (message) {
        var processedMessage = JSON.stringify(message);
        var messageBytesSize = this.sizeInBytes(processedMessage);
        return { processedMessage: processedMessage, messageBytesSize: messageBytesSize };
    };
    Batch.prototype.push = function (processedMessage, messageBytesSize, key) {
        if (this.bufferMessageCount > 0) {
            // \n separator at serialization
            this.bufferBytesSize += 1;
        }
        if (key !== undefined) {
            this.upsertBuffer[key] = processedMessage;
        }
        else {
            this.pushOnlyBuffer.push(processedMessage);
        }
        this.bufferBytesSize += messageBytesSize;
        this.bufferMessageCount += 1;
    };
    Batch.prototype.remove = function (key) {
        var removedMessage = this.upsertBuffer[key];
        delete this.upsertBuffer[key];
        var messageBytesSize = this.sizeInBytes(removedMessage);
        this.bufferBytesSize -= messageBytesSize;
        this.bufferMessageCount -= 1;
        if (this.bufferMessageCount > 0) {
            this.bufferBytesSize -= 1;
        }
    };
    Batch.prototype.hasMessageFor = function (key) {
        return key !== undefined && this.upsertBuffer[key] !== undefined;
    };
    Batch.prototype.willReachedBytesLimitWith = function (messageBytesSize) {
        // byte of the separator at the end of the message
        return this.bufferBytesSize + messageBytesSize + 1 >= this.bytesLimit;
    };
    Batch.prototype.isFull = function () {
        return this.bufferMessageCount === this.maxSize || this.bufferBytesSize >= this.bytesLimit;
    };
    Batch.prototype.flushPeriodically = function () {
        var _this = this;
        setTimeout(function () {
            _this.flush('flushPeriodically');
            _this.flushPeriodically();
        }, this.flushTimeout);
    };
    return Batch;
}());
export { Batch };
//# sourceMappingURL=batch.js.map