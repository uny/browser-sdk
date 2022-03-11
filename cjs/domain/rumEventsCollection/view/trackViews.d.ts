import type { Duration, ClocksState, TimeStamp, Observable, RelativeTime } from '@datadog/browser-core';
import type { ViewCustomTimings } from '../../../rawRumEvent.types';
import { ViewLoadingType } from '../../../rawRumEvent.types';
import type { LifeCycle } from '../../lifeCycle';
import type { EventCounts } from '../../trackEventCounts';
import type { LocationChange } from '../../../browser/locationChangeObservable';
import type { Timings } from './trackInitialViewTimings';
export interface ViewEvent {
    id: string;
    name?: string;
    location: Readonly<Location>;
    timings: Timings;
    customTimings: ViewCustomTimings;
    eventCounts: EventCounts;
    documentVersion: number;
    startClocks: ClocksState;
    duration: Duration;
    isActive: boolean;
    loadingTime?: Duration;
    loadingType: ViewLoadingType;
    cumulativeLayoutShift?: number;
}
export interface ViewCreatedEvent {
    id: string;
    name?: string;
    startClocks: ClocksState;
}
export interface ViewEndedEvent {
    endClocks: ClocksState;
}
export declare const THROTTLE_VIEW_UPDATE_PERIOD = 3000;
export declare const SESSION_KEEP_ALIVE_INTERVAL: number;
export declare function trackViews(location: Location, lifeCycle: LifeCycle, domMutationObservable: Observable<void>, locationChangeObservable: Observable<LocationChange>, areViewsTrackedAutomatically: boolean, initialViewName?: string): {
    addTiming: (name: string, time?: RelativeTime | TimeStamp) => void;
    startView: (name?: string | undefined, startClocks?: ClocksState | undefined) => void;
    stop: () => void;
};
