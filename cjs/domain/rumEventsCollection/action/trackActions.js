"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackActions = exports.AUTO_ACTION_MAX_DURATION = void 0;
var browser_core_1 = require("@datadog/browser-core");
var trackEventCounts_1 = require("../../trackEventCounts");
var waitIdlePage_1 = require("../../waitIdlePage");
var getActionNameFromElement_1 = require("./getActionNameFromElement");
// Maximum duration for automatic actions
exports.AUTO_ACTION_MAX_DURATION = 10 * browser_core_1.ONE_SECOND;
function trackActions(lifeCycle, domMutationObservable, _a) {
    var actionNameAttribute = _a.actionNameAttribute;
    var action = startActionManagement(lifeCycle, domMutationObservable);
    // New views trigger the discard of the current pending Action
    lifeCycle.subscribe(4 /* VIEW_CREATED */, function () {
        action.discardCurrent();
    });
    var stopListener = (0, browser_core_1.addEventListener)(window, "click" /* CLICK */, function (event) {
        if (!(event.target instanceof Element)) {
            return;
        }
        var name = (0, getActionNameFromElement_1.getActionNameFromElement)(event.target, actionNameAttribute);
        if (!name) {
            return;
        }
        action.create("click" /* CLICK */, name, event);
    }, { capture: true }).stop;
    return {
        stop: function () {
            action.discardCurrent();
            stopListener();
        },
    };
}
exports.trackActions = trackActions;
function startActionManagement(lifeCycle, domMutationObservable) {
    var currentAction;
    var stopWaitingIdlePage;
    return {
        create: function (type, name, event) {
            if (currentAction) {
                // Ignore any new action if another one is already occurring.
                return;
            }
            var pendingAutoAction = new PendingAutoAction(lifeCycle, type, name, event);
            currentAction = pendingAutoAction;
            (stopWaitingIdlePage = (0, waitIdlePage_1.waitIdlePage)(lifeCycle, domMutationObservable, function (event) {
                if (event.hadActivity) {
                    var duration = (0, browser_core_1.elapsed)(pendingAutoAction.startClocks.timeStamp, event.end);
                    if (duration >= 0) {
                        pendingAutoAction.complete(duration);
                    }
                    else {
                        pendingAutoAction.discard();
                    }
                }
                else {
                    pendingAutoAction.discard();
                }
                currentAction = undefined;
            }, exports.AUTO_ACTION_MAX_DURATION).stop);
        },
        discardCurrent: function () {
            if (currentAction) {
                stopWaitingIdlePage();
                currentAction.discard();
                currentAction = undefined;
            }
        },
    };
}
var PendingAutoAction = /** @class */ (function () {
    function PendingAutoAction(lifeCycle, type, name, event) {
        this.lifeCycle = lifeCycle;
        this.type = type;
        this.name = name;
        this.event = event;
        this.id = (0, browser_core_1.generateUUID)();
        this.startClocks = (0, browser_core_1.clocksNow)();
        this.eventCountsSubscription = (0, trackEventCounts_1.trackEventCounts)(lifeCycle);
        this.lifeCycle.notify(1 /* AUTO_ACTION_CREATED */, { id: this.id, startClocks: this.startClocks });
    }
    PendingAutoAction.prototype.complete = function (duration) {
        var eventCounts = this.eventCountsSubscription.eventCounts;
        this.lifeCycle.notify(2 /* AUTO_ACTION_COMPLETED */, {
            counts: {
                errorCount: eventCounts.errorCount,
                longTaskCount: eventCounts.longTaskCount,
                resourceCount: eventCounts.resourceCount,
            },
            duration: duration,
            id: this.id,
            name: this.name,
            startClocks: this.startClocks,
            type: this.type,
            event: this.event,
        });
        this.eventCountsSubscription.stop();
    };
    PendingAutoAction.prototype.discard = function () {
        this.lifeCycle.notify(3 /* AUTO_ACTION_DISCARDED */);
        this.eventCountsSubscription.stop();
    };
    return PendingAutoAction;
}());
//# sourceMappingURL=trackActions.js.map