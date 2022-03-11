"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElectronEventBridgeListener = exports.registerEventBridge = exports.BRIDGE_CHANNEL = void 0;
var browser_core_1 = require("@datadog/browser-core");
// eslint-disable-next-line local-rules/disallow-side-effects
var electron_1 = require("electron");
exports.BRIDGE_CHANNEL = 'datadog-rum-event-bridge';
function registerEventBridge() {
    electron_1.contextBridge.exposeInMainWorld('DatadogEventBridge', {
        send: function (serializedEvent) {
            electron_1.ipcRenderer.send(exports.BRIDGE_CHANNEL, serializedEvent);
        },
        getAllowedWebViewHosts: function () {
            return JSON.stringify([window.location.hostname]);
        },
    });
}
exports.registerEventBridge = registerEventBridge;
function getElectronEventBridgeListener(sessionManager, applicationId, rumBatch, internalMonitoringBatch) {
    return function (serializedEvent) {
        var _a = JSON.parse(serializedEvent.toString()), eventType = _a.eventType, event = _a.event;
        var session = sessionManager.findTrackedSession();
        if (!session) {
            return;
        }
        var completedEvent = (0, browser_core_1.combine)(event, {
            session: { id: session.id },
            application: { id: applicationId },
        });
        if (eventType === 'rum') {
            if (completedEvent.type === 'view') {
                rumBatch.upsert(completedEvent, completedEvent.view.id);
            }
            else {
                rumBatch.add(completedEvent);
            }
        }
        else if (eventType === 'internal_log' || eventType === 'internal_telemetry') {
            if (internalMonitoringBatch) {
                internalMonitoringBatch.add(completedEvent);
            }
            else {
                browser_core_1.display.warn('internal monitoring event received but no endpoint has been configured');
            }
        }
        else {
            browser_core_1.display.error("unknown event type: ".concat(eventType, " received through event bridge"));
        }
    };
}
exports.getElectronEventBridgeListener = getElectronEventBridgeListener;
//# sourceMappingURL=eventBridge.js.map