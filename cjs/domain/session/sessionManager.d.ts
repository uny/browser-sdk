import type { Context, Observable, RelativeTime } from '@datadog/browser-core';
import type { CookieOptions } from '../../browser/cookie';
export interface SessionManager<TrackingType extends string> {
    findActiveSession: (startTime?: RelativeTime) => SessionContext<TrackingType> | undefined;
    renewObservable: Observable<void>;
    expireObservable: Observable<void>;
}
export interface SessionContext<TrackingType extends string> extends Context {
    id: string;
    trackingType: TrackingType;
}
export declare const VISIBILITY_CHECK_DELAY: number;
export declare function startSessionManager<TrackingType extends string>(options: CookieOptions, productKey: string, computeSessionState: (rawTrackingType?: string) => {
    trackingType: TrackingType;
    isTracked: boolean;
}): Promise<SessionManager<TrackingType>>;
export declare function stopSessionManager(): void;
export declare function relativeNow(): RelativeTime;
