import type { InternalContext } from '../rawRumEvent.types';
import type { ParentContexts } from './parentContexts';
import type { RumSessionManager } from './rumSessionManager';
import type { UrlContexts } from './urlContexts';
/**
 * Internal context keep returning v1 format
 * to not break compatibility with logs data format
 */
export declare function startInternalContext(applicationId: string, sessionManager: RumSessionManager, parentContexts: ParentContexts, urlContexts: UrlContexts): {
    get: (startTime?: number | undefined) => InternalContext | undefined;
};
