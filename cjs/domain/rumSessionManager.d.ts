import type { RelativeTime } from '@datadog/browser-core';
import type { RumConfiguration } from './configuration';
import type { LifeCycle } from './lifeCycle';
export declare const RUM_SESSION_KEY = "rum";
export interface RumSessionManager {
    findTrackedSession: (startTime?: RelativeTime) => RumSession | undefined;
}
export declare type RumSession = {
    id: string;
    hasReplayPlan: boolean;
    hasLitePlan: boolean;
};
export declare const enum RumSessionPlan {
    LITE = 1,
    REPLAY = 2
}
export declare const enum RumTrackingType {
    NOT_TRACKED = "0",
    TRACKED_REPLAY = "1",
    TRACKED_LITE = "2"
}
export declare function startRumSessionManager(configuration: RumConfiguration, lifeCycle: LifeCycle): RumSessionManager;
/**
 * Start a tracked replay session stub
 * It needs to be a replay plan in order to get long tasks
 */
export declare function startRumSessionManagerStub(): RumSessionManager;
