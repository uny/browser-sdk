import type { Observable } from '@datadog/browser-core';
import { LifeCycle } from '../domain/lifeCycle';
import type { RumSessionManager } from '../domain/rumSessionManager';
import type { CommonContext } from '../rawRumEvent.types';
import type { LocationChange } from '../browser/locationChangeObservable';
import type { RumConfiguration } from '../domain/configuration';
import type { RecorderApi } from './rumPublicApi';
export declare function startRum(configuration: RumConfiguration, getCommonContext: () => CommonContext, recorderApi: RecorderApi, initialViewName?: string): {
    addAction: (action: import("../domain/rumEventsCollection/action/trackActions").CustomAction, savedCommonContext?: CommonContext | undefined) => void;
    addError: ({ error, handlingStack, startClocks, context: customerContext }: import("../domain/rumEventsCollection/error/errorCollection").ProvidedError, savedCommonContext?: CommonContext | undefined) => void;
    addTiming: (name: string, time?: import("@datadog/browser-core").TimeStamp | import("@datadog/browser-core").RelativeTime) => void;
    startView: (name?: string | undefined, startClocks?: import("@datadog/browser-core").ClocksState | undefined) => void;
    lifeCycle: LifeCycle;
    parentContexts: import("../domain/parentContexts").ParentContexts;
    session: RumSessionManager;
    getInternalContext: (startTime?: number | undefined) => import("../rawRumEvent.types").InternalContext | undefined;
};
export declare function startRumEventCollection(lifeCycle: LifeCycle, configuration: RumConfiguration, location: Location, sessionManager: RumSessionManager, locationChangeObservable: Observable<LocationChange>, getCommonContext: () => CommonContext): {
    parentContexts: import("../domain/parentContexts").ParentContexts;
    foregroundContexts: import("../domain/foregroundContexts").ForegroundContexts;
    urlContexts: {
        findUrl: (startTime?: import("@datadog/browser-core").RelativeTime | undefined) => import("../rawRumEvent.types").UrlContext | undefined;
        stop: () => void;
    };
    stop: () => void;
};
