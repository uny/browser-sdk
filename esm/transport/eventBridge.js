import { getGlobalObject, includes } from '..';
export function getEventBridge() {
    var eventBridgeGlobal = getEventBridgeGlobal();
    if (!eventBridgeGlobal) {
        return;
    }
    return {
        getAllowedWebViewHosts: function () {
            return JSON.parse(eventBridgeGlobal.getAllowedWebViewHosts());
        },
        send: function (eventType, event) {
            eventBridgeGlobal.send(JSON.stringify({ eventType: eventType, event: event }));
        },
    };
}
export function canUseEventBridge() {
    var bridge = getEventBridge();
    return !!bridge && includes(bridge.getAllowedWebViewHosts(), window.location.hostname);
}
function getEventBridgeGlobal() {
    return getGlobalObject().DatadogEventBridge;
}
//# sourceMappingURL=eventBridge.js.map