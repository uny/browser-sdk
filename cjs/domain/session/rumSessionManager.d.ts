import type { RelativeTime } from '@datadog/browser-core';
import type { RumConfiguration } from '@datadog/browser-rum-core';
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
export declare function startRumSessionManager(configuration: RumConfiguration): Promise<RumSessionManager>;
