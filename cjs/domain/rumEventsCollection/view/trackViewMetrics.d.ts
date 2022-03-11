import type { Duration, Observable, ClocksState } from '@datadog/browser-core';
import { ViewLoadingType } from '../../../rawRumEvent.types';
import type { LifeCycle } from '../../lifeCycle';
import type { EventCounts } from '../../trackEventCounts';
export interface ViewMetrics {
    eventCounts: EventCounts;
    loadingTime?: Duration;
    cumulativeLayoutShift?: number;
}
export declare function trackViewMetrics(lifeCycle: LifeCycle, domMutationObservable: Observable<void>, scheduleViewUpdate: () => void, loadingType: ViewLoadingType, viewStart: ClocksState): {
    stop: () => void;
    setLoadEvent: (loadEvent: Duration) => void;
    viewMetrics: ViewMetrics;
};
