"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSessionStore = exports.SESSION_TIME_OUT_DELAY = exports.SESSION_EXPIRATION_DELAY = void 0;
var cookie_1 = require("../../browser/cookie");
var observable_1 = require("../../tools/observable");
var utils = __importStar(require("../../tools/utils"));
var internalMonitoring_1 = require("../internalMonitoring");
var sessionCookieStore_1 = require("./sessionCookieStore");
exports.SESSION_EXPIRATION_DELAY = 15 * utils.ONE_MINUTE;
exports.SESSION_TIME_OUT_DELAY = 4 * utils.ONE_HOUR;
/**
 * Different session concepts:
 * - tracked, the session has an id and is updated along the user navigation
 * - not tracked, the session does not have an id but it is updated along the user navigation
 * - inactive, no session in store or session expired, waiting for a renew session
 */
function startSessionStore(options, productKey, computeSessionState) {
    var renewObservable = new observable_1.Observable();
    var expireObservable = new observable_1.Observable();
    var watchSessionTimeoutId = setInterval((0, internalMonitoring_1.monitor)(watchSession), cookie_1.COOKIE_ACCESS_DELAY);
    var sessionCache = retrieveActiveSession();
    function expandOrRenewSession() {
        var isTracked;
        (0, sessionCookieStore_1.withCookieLockAccess)({
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
        });
    }
    function expandSession() {
        (0, sessionCookieStore_1.withCookieLockAccess)({
            options: options,
            process: function (cookieSession) { return (hasSessionInCache() ? synchronizeSession(cookieSession) : undefined); },
        });
    }
    /**
     * allows two behaviors:
     * - if the session is active, synchronize the session cache without updating the session cookie
     * - if the session is not active, clear the session cookie and expire the session cache
     */
    function watchSession() {
        (0, sessionCookieStore_1.withCookieLockAccess)({
            options: options,
            process: function (cookieSession) { return (!isActiveSession(cookieSession) ? {} : undefined); },
            after: synchronizeSession,
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
            cookieSession.id = utils.generateUUID();
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
        var session = (0, sessionCookieStore_1.retrieveSession)();
        if (isActiveSession(session)) {
            return session;
        }
        return {};
    }
    function isActiveSession(session) {
        // created and expire can be undefined for versions which was not storing them
        // these checks could be removed when older versions will not be available/live anymore
        return ((session.created === undefined || Date.now() - Number(session.created) < exports.SESSION_TIME_OUT_DELAY) &&
            (session.expire === undefined || Date.now() < Number(session.expire)));
    }
    return {
        expandOrRenewSession: utils.throttle((0, internalMonitoring_1.monitor)(expandOrRenewSession), cookie_1.COOKIE_ACCESS_DELAY).throttled,
        expandSession: expandSession,
        getSession: function () { return sessionCache; },
        renewObservable: renewObservable,
        expireObservable: expireObservable,
        stop: function () {
            clearInterval(watchSessionTimeoutId);
        },
    };
}
exports.startSessionStore = startSessionStore;
//# sourceMappingURL=sessionStore.js.map