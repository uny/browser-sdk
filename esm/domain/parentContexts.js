import { ONE_MINUTE, SESSION_TIME_OUT_DELAY, ContextHistory } from '@datadog/browser-core';
export var VIEW_CONTEXT_TIME_OUT_DELAY = SESSION_TIME_OUT_DELAY;
export var ACTION_CONTEXT_TIME_OUT_DELAY = 5 * ONE_MINUTE; // arbitrary
export function startParentContexts(lifeCycle) {
    var viewContextHistory = new ContextHistory(VIEW_CONTEXT_TIME_OUT_DELAY);
    var actionContextHistory = new ContextHistory(ACTION_CONTEXT_TIME_OUT_DELAY);
    lifeCycle.subscribe(4 /* VIEW_CREATED */, function (view) {
        viewContextHistory.setCurrent(buildViewContext(view), view.startClocks.relative);
    });
    lifeCycle.subscribe(5 /* VIEW_UPDATED */, function (view) {
        // A view can be updated after its end.  We have to ensure that the view being updated is the
        // most recently created.
        var current = viewContextHistory.getCurrent();
        if (current && current.view.id === view.id) {
            viewContextHistory.setCurrent(buildViewContext(view), view.startClocks.relative);
        }
    });
    lifeCycle.subscribe(6 /* VIEW_ENDED */, function (_a) {
        var endClocks = _a.endClocks;
        viewContextHistory.closeCurrent(endClocks.relative);
    });
    lifeCycle.subscribe(1 /* AUTO_ACTION_CREATED */, function (action) {
        actionContextHistory.setCurrent(buildActionContext(action), action.startClocks.relative);
    });
    lifeCycle.subscribe(2 /* AUTO_ACTION_COMPLETED */, function (action) {
        if (actionContextHistory.getCurrent()) {
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            var actionEndTime = (action.startClocks.relative + action.duration);
            actionContextHistory.closeCurrent(actionEndTime);
        }
    });
    lifeCycle.subscribe(3 /* AUTO_ACTION_DISCARDED */, function () {
        actionContextHistory.clearCurrent();
    });
    lifeCycle.subscribe(10 /* SESSION_RENEWED */, function () {
        viewContextHistory.reset();
        actionContextHistory.reset();
    });
    function buildViewContext(view) {
        return {
            view: {
                id: view.id,
                name: view.name,
            },
        };
    }
    function buildActionContext(action) {
        return { action: { id: action.id } };
    }
    return {
        findAction: function (startTime) { return actionContextHistory.find(startTime); },
        findView: function (startTime) { return viewContextHistory.find(startTime); },
        stop: function () {
            viewContextHistory.stop();
            actionContextHistory.stop();
        },
    };
}
//# sourceMappingURL=parentContexts.js.map