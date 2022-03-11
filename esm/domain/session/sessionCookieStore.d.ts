import type { CookieOptions } from '../../browser/cookie';
import type { SessionState } from './sessionStore';
export declare const SESSION_COOKIE_NAME = "_dd_s";
declare type Operations = {
    options: CookieOptions;
    process: (cookieSession: SessionState) => SessionState | undefined;
    after?: (cookieSession: SessionState) => void;
};
export declare function newCookieOperations(operations: Operations): Promise<void>;
export declare function persistSession(session: SessionState, options: CookieOptions): Promise<void>;
export declare function toSessionString(session: SessionState): string;
export declare function retrieveSession(): Promise<SessionState>;
export {};
