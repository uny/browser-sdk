var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// eslint-disable-next-line local-rules/disallow-side-effects
import { performance } from 'perf_hooks';
// eslint-disable-next-line local-rules/disallow-side-effects
import { app, BrowserWindow } from 'electron';
import { ContextHistory, monitor, SESSION_TIME_OUT_DELAY } from '@datadog/browser-core';
import { startSessionStore } from './sessionStore';
export var VISIBILITY_CHECK_DELAY = 60 * 1000;
var SESSION_CONTEXT_TIMEOUT_DELAY = SESSION_TIME_OUT_DELAY;
var stopCallbacks = [];
export function startSessionManager(options, productKey, computeSessionState) {
    return __awaiter(this, void 0, void 0, function () {
        function buildSessionContext() {
            return {
                id: sessionStore.getSession().id,
                trackingType: sessionStore.getSession()[productKey],
            };
        }
        var sessionStore, sessionContextHistory;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, startSessionStore(options, productKey, computeSessionState)];
                case 1:
                    sessionStore = _a.sent();
                    stopCallbacks.push(function () { return sessionStore.stop(); });
                    sessionContextHistory = new ContextHistory(SESSION_CONTEXT_TIMEOUT_DELAY);
                    stopCallbacks.push(function () { return sessionContextHistory.stop(); });
                    sessionStore.renewObservable.subscribe(function () {
                        sessionContextHistory.setCurrent(buildSessionContext(), relativeNow());
                    });
                    sessionStore.expireObservable.subscribe(function () {
                        sessionContextHistory.closeCurrent(relativeNow());
                    });
                    return [4 /*yield*/, sessionStore.expandOrRenewSession()];
                case 2:
                    _a.sent();
                    sessionContextHistory.setCurrent(buildSessionContext(), 0);
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    trackActivity(function () { return sessionStore.expandOrRenewSession(); });
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    trackVisibility(function () { return sessionStore.expandSession(); });
                    return [2 /*return*/, {
                            findActiveSession: function (startTime) { return sessionContextHistory.find(startTime); },
                            renewObservable: sessionStore.renewObservable,
                            expireObservable: sessionStore.expireObservable,
                        }];
            }
        });
    });
}
export function stopSessionManager() {
    stopCallbacks.forEach(function (e) { return e(); });
    stopCallbacks = [];
}
function trackActivity(expandOrRenewSession) {
    app.on('browser-window-created', expandOrRenewSession);
    app.on('before-quit', stopSessionManager);
}
function trackVisibility(expandSession) {
    var expandSessionWhenVisible = monitor(function () {
        if (BrowserWindow.getAllWindows().find(function (w) { return w.isVisible(); })) {
            expandSession();
        }
    });
    app.on('browser-window-focus', expandSessionWhenVisible);
    stopCallbacks.push(function () { return app.removeListener('browser-window-focus', expandSessionWhenVisible); });
    var visibilityCheckInterval = setInterval(expandSessionWhenVisible, VISIBILITY_CHECK_DELAY);
    stopCallbacks.push(function () {
        clearInterval(visibilityCheckInterval);
    });
}
export function relativeNow() {
    return performance.now();
}
//# sourceMappingURL=sessionManager.js.map