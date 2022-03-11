"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUseEventBridge = exports.getEventBridge = void 0;
var __1 = require("..");
function getEventBridge() {
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
exports.getEventBridge = getEventBridge;
function canUseEventBridge() {
    var bridge = getEventBridge();
    return !!bridge && (0, __1.includes)(bridge.getAllowedWebViewHosts(), window.location.hostname);
}
exports.canUseEventBridge = canUseEventBridge;
function getEventBridgeGlobal() {
    return (0, __1.getGlobalObject)().DatadogEventBridge;
}
//# sourceMappingURL=eventBridge.js.map