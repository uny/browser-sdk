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
import { getCookie, setCookie } from '../../browser/cookie';
import { SESSION_EXPIRATION_DELAY } from './sessionStore';
var SESSION_ENTRY_REGEXP = /^([a-z]+)=([a-z0-9-]+)$/;
var SESSION_ENTRY_SEPARATOR = '&';
export var SESSION_COOKIE_NAME = '_dd_s';
var bufferedOperations = [];
var ongoingOperations;
export function newCookieOperations(operations) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var currentSession, processedSession;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!ongoingOperations) {
                        ongoingOperations = operations;
                    }
                    if (operations !== ongoingOperations) {
                        bufferedOperations.push(operations);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, retrieveSession()];
                case 1:
                    currentSession = _b.sent();
                    processedSession = operations.process(currentSession);
                    if (!processedSession) return [3 /*break*/, 3];
                    return [4 /*yield*/, persistSession(processedSession, operations.options)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    // call after even if session is not persisted in order to perform operations on
                    // up-to-date cookie value, the value could have been modified by another promise
                    (_a = operations.after) === null || _a === void 0 ? void 0 : _a.call(operations, processedSession || currentSession);
                    return [2 /*return*/, next()];
            }
        });
    });
}
function next() {
    return __awaiter(this, void 0, void 0, function () {
        var nextOperations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ongoingOperations = undefined;
                    nextOperations = bufferedOperations.shift();
                    if (!nextOperations) return [3 /*break*/, 2];
                    return [4 /*yield*/, newCookieOperations(nextOperations)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
export function persistSession(session, options) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (isExpiredState(session)) {
                return [2 /*return*/, clearSession(options)];
            }
            session.expire = String(Date.now() + SESSION_EXPIRATION_DELAY);
            return [2 /*return*/, setSession(session, options)];
        });
    });
}
function setSession(session, options) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, setCookie(SESSION_COOKIE_NAME, toSessionString(session), SESSION_EXPIRATION_DELAY, options)];
        });
    });
}
export function toSessionString(session) {
    return Object.keys(session)
        .map(function (key) { return [key, session[key]]; })
        .map(function (_a) {
        var key = _a[0], value = _a[1];
        return "".concat(key, "=").concat(value);
    })
        .join(SESSION_ENTRY_SEPARATOR);
}
export function retrieveSession() {
    return __awaiter(this, void 0, void 0, function () {
        var sessionString, session;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getCookie(SESSION_COOKIE_NAME)];
                case 1:
                    sessionString = _a.sent();
                    session = {};
                    if (isValidSessionString(sessionString)) {
                        sessionString.split(SESSION_ENTRY_SEPARATOR).forEach(function (entry) {
                            var matches = SESSION_ENTRY_REGEXP.exec(entry);
                            if (matches !== null) {
                                var key = matches[1], value = matches[2];
                                session[key] = value;
                            }
                        });
                    }
                    return [2 /*return*/, session];
            }
        });
    });
}
function isValidSessionString(sessionString) {
    return (sessionString !== undefined &&
        (sessionString.indexOf(SESSION_ENTRY_SEPARATOR) !== -1 || SESSION_ENTRY_REGEXP.test(sessionString)));
}
function isExpiredState(session) {
    return Object.keys(session).length === 0;
}
function clearSession(options) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, setCookie(SESSION_COOKIE_NAME, '', 0, options)];
        });
    });
}
//# sourceMappingURL=sessionCookieStore.js.map