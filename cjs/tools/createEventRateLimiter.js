"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventRateLimiter = void 0;
var __1 = require("..");
function createEventRateLimiter(eventType, limit, onLimitReached) {
    var eventCount = 0;
    var allowNextEvent = false;
    return {
        isLimitReached: function () {
            if (eventCount === 0) {
                setTimeout(function () {
                    eventCount = 0;
                }, __1.ONE_MINUTE);
            }
            eventCount += 1;
            if (eventCount <= limit || allowNextEvent) {
                allowNextEvent = false;
                return false;
            }
            if (eventCount === limit + 1) {
                allowNextEvent = true;
                try {
                    onLimitReached({
                        message: "Reached max number of ".concat(eventType, "s by minute: ").concat(limit),
                        source: __1.ErrorSource.AGENT,
                        startClocks: (0, __1.clocksNow)(),
                    });
                }
                finally {
                    allowNextEvent = false;
                }
            }
            return true;
        },
    };
}
exports.createEventRateLimiter = createEventRateLimiter;
//# sourceMappingURL=createEventRateLimiter.js.map