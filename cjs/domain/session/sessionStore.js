"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSessionStore = exports.SESSION_TIME_OUT_DELAY = exports.SESSION_EXPIRATION_DELAY = void 0;
var browser_core_1 = require("@datadog/browser-core");
var sessionCookieStore_1 = require("./sessionCookieStore");
exports.SESSION_EXPIRATION_DELAY = 15 * browser_core_1.ONE_MINUTE;
exports.SESSION_TIME_OUT_DELAY = 4 * browser_core_1.ONE_HOUR;
/**
 * Different session concepts:
 * - tracked, the session has an id and is updated along the user navigation
 * - not tracked, the session does not have an id but it is updated along the user navigation
 * - inactive, no session in store or session expired, waiting for a renew session
 */
function startSessionStore(options, productKey, computeSessionState) {
    return __awaiter(this, void 0, void 0, function () {
        function expandOrRenewSession() {
            return __awaiter(this, void 0, void 0, function () {
                var isTracked;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, sessionCookieStore_1.newCookieOperations)({
                                options: options,
                                process: function (cookieSession) {
                                    var synchronizedSession = synchronizeSession(cookieSession);
                                    isTracked = expandOrRenewCookie(synchronizedSession);
                                    return synchronizedSession;
                                },
                                after: function (cookieSession) {
                                    if (isTracked && !hasSessionInCache()) {
                                        renewSession(cookieSession);
                                    }
                                    sessionCache = cookieSession;
                                },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        function expandSession() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, sessionCookieStore_1.newCookieOperations)({
                                options: options,
                                process: function (cookieSession) { return (hasSessionInCache() ? synchronizeSession(cookieSession) : undefined); },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        /**
         * allows two behaviors:
         * - if the session is active, synchronize the session cache without updating the session cookie
         * - if the session is not active, clear the session cookie and expire the session cache
         */
        function watchSession() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, sessionCookieStore_1.newCookieOperations)({
                                options: options,
                                process: function (cookieSession) { return (!isActiveSession(cookieSession) ? {} : undefined); },
                                after: synchronizeSession,
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        function synchronizeSession(cookieSession) {
            if (!isActiveSession(cookieSession)) {
                cookieSession = {};
            }
            if (hasSessionInCache()) {
                if (isSessionInCacheOutdated(cookieSession)) {
                    expireSession();
                }
                else {
                    sessionCache = cookieSession;
                }
            }
            return cookieSession;
        }
        function expandOrRenewCookie(cookieSession) {
            var _a = computeSessionState(cookieSession[productKey]), trackingType = _a.trackingType, isTracked = _a.isTracked;
            cookieSession[productKey] = trackingType;
            if (isTracked && !cookieSession.id) {
                cookieSession.id = (0, browser_core_1.generateUUID)();
                cookieSession.created = String(Date.now());
            }
            return isTracked;
        }
        function hasSessionInCache() {
            return sessionCache[productKey] !== undefined;
        }
        function isSessionInCacheOutdated(cookieSession) {
            return sessionCache.id !== cookieSession.id || sessionCache[productKey] !== cookieSession[productKey];
        }
        function expireSession() {
            sessionCache = {};
            expireObservable.notify();
        }
        function renewSession(cookieSession) {
            sessionCache = cookieSession;
            renewObservable.notify();
        }
        function retrieveActiveSession() {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, sessionCookieStore_1.retrieveSession)()];
                        case 1:
                            session = _a.sent();
                            if (isActiveSession(session)) {
                                return [2 /*return*/, session];
                            }
                            return [2 /*return*/, {}];
                    }
                });
            });
        }
        function isActiveSession(session) {
            // created and expire can be undefined for versions which was not storing them
            // these checks could be removed when older versions will not be available/live anymore
            return ((session.created === undefined || Date.now() - Number(session.created) < exports.SESSION_TIME_OUT_DELAY) &&
                (session.expire === undefined || Date.now() < Number(session.expire)));
        }
        var renewObservable, expireObservable, watchSessionTimeoutId, sessionCache;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    renewObservable = new browser_core_1.Observable();
                    expireObservable = new browser_core_1.Observable();
                    watchSessionTimeoutId = setInterval((0, browser_core_1.monitor)(watchSession), browser_core_1.COOKIE_ACCESS_DELAY);
                    return [4 /*yield*/, retrieveActiveSession()];
                case 1:
                    sessionCache = _a.sent();
                    return [2 /*return*/, {
                            expandOrRenewSession: (0, browser_core_1.monitor)(expandOrRenewSession),
                            expandSession: expandSession,
                            getSession: function () { return sessionCache; },
                            renewObservable: renewObservable,
                            expireObservable: expireObservable,
                            stop: function () {
                                clearInterval(watchSessionTimeoutId);
                            },
                        }];
            }
        });
    });
}
exports.startSessionStore = startSessionStore;
//# sourceMappingURL=sessionStore.js.map