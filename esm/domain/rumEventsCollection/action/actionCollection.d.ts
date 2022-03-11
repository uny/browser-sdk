import type { Observable } from '@datadog/browser-core';
import type { CommonContext } from '../../../rawRumEvent.types';
import type { LifeCycle } from '../../lifeCycle';
import type { ForegroundContexts } from '../../foregroundContexts';
import type { RumConfiguration } from '../../configuration';
import type { CustomAction } from './trackActions';
export declare function startActionCollection(lifeCycle: LifeCycle, domMutationObservable: Observable<void>, configuration: RumConfiguration, foregroundContexts: ForegroundContexts): {
    addAction: (action: CustomAction, savedCommonContext?: CommonContext | undefined) => void;
};
