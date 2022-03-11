"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventBridge = exports.BRIDGE_CHANNEL = exports.startElectronRum = void 0;
var startElectronRum_1 = require("../boot/startElectronRum");
Object.defineProperty(exports, "startElectronRum", { enumerable: true, get: function () { return startElectronRum_1.startElectronRum; } });
var eventBridge_1 = require("../browser/eventBridge");
Object.defineProperty(exports, "BRIDGE_CHANNEL", { enumerable: true, get: function () { return eventBridge_1.BRIDGE_CHANNEL; } });
Object.defineProperty(exports, "registerEventBridge", { enumerable: true, get: function () { return eventBridge_1.registerEventBridge; } });
//# sourceMappingURL=main.js.map