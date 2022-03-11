import type { RelativeTime } from '@datadog/browser-core';
import type { ActionContext, ViewContext } from '../rawRumEvent.types';
import type { LifeCycle } from './lifeCycle';
export declare const VIEW_CONTEXT_TIME_OUT_DELAY: number;
export declare const ACTION_CONTEXT_TIME_OUT_DELAY: number;
export interface ParentContexts {
    findAction: (startTime?: RelativeTime) => ActionContext | undefined;
    findView: (startTime?: RelativeTime) => ViewContext | undefined;
    stop: () => void;
}
export declare function startParentContexts(lifeCycle: LifeCycle): ParentContexts;
