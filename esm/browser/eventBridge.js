import { combine, display } from '@datadog/browser-core';
// eslint-disable-next-line local-rules/disallow-side-effects
import { contextBridge, ipcRenderer } from 'electron';
export var BRIDGE_CHANNEL = 'datadog-rum-event-bridge';
export function registerEventBridge() {
    contextBridge.exposeInMainWorld('DatadogEventBridge', {
        send: function (serializedEvent) {
            ipcRenderer.send(BRIDGE_CHANNEL, serializedEvent);
        },
        getAllowedWebViewHosts: function () {
            return JSON.stringify([window.location.hostname]);
        },
    });
}
export function getElectronEventBridgeListener(sessionManager, applicationId, rumBatch, internalMonitoringBatch) {
    return function (serializedEvent) {
        var _a = JSON.parse(serializedEvent.toString()), eventType = _a.eventType, event = _a.event;
        var session = sessionManager.findTrackedSession();
        if (!session) {
            return;
        }
        var completedEvent = combine(event, {
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
                display.warn('internal monitoring event received but no endpoint has been configured');
            }
        }
        else {
            display.error("unknown event type: ".concat(eventType, " received through event bridge"));
        }
    };
}
//# sourceMappingURL=eventBridge.js.map