import type { RumSessionManager } from '@datadog/browser-rum-core';
import type { Batch } from '../transport/batch';
export declare const BRIDGE_CHANNEL = "datadog-rum-event-bridge";
export declare function registerEventBridge(): void;
export declare function getElectronEventBridgeListener(sessionManager: RumSessionManager, applicationId: string, rumBatch: Batch, internalMonitoringBatch?: Batch): (serializedEvent: string) => void;
