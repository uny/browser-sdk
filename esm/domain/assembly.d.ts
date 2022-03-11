import type { CommonContext } from '../rawRumEvent.types';
import type { LifeCycle } from './lifeCycle';
import type { ParentContexts } from './parentContexts';
import type { RumSessionManager } from './rumSessionManager';
import type { UrlContexts } from './urlContexts';
import type { RumConfiguration } from './configuration';
export declare function startRumAssembly(configuration: RumConfiguration, lifeCycle: LifeCycle, sessionManager: RumSessionManager, parentContexts: ParentContexts, urlContexts: UrlContexts, getCommonContext: () => CommonContext): void;
