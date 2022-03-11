import type { CookieOptions } from '../../browser/cookie';
import type { TransportConfiguration } from './transportConfiguration';
export declare const DefaultPrivacyLevel: {
    readonly ALLOW: "allow";
    readonly MASK: "mask";
    readonly MASK_USER_INPUT: "mask-user-input";
};
export declare type DefaultPrivacyLevel = typeof DefaultPrivacyLevel[keyof typeof DefaultPrivacyLevel];
export interface InitConfiguration {
    clientToken: string;
    beforeSend?: GenericBeforeSendCallback | undefined;
    sampleRate?: number | undefined;
    silentMultipleInit?: boolean | undefined;
    proxyUrl?: string | undefined;
    site?: string | undefined;
    service?: string | undefined;
    env?: string | undefined;
    version?: string | undefined;
    useCrossSiteSessionCookie?: boolean | undefined;
    useSecureSessionCookie?: boolean | undefined;
    trackSessionAcrossSubdomains?: boolean | undefined;
    enableExperimentalFeatures?: string[] | undefined;
    internalMonitoringApiKey?: string | undefined;
    replica?: ReplicaUserConfiguration | undefined;
    datacenter?: string;
}
declare type GenericBeforeSendCallback = (event: any, context?: any) => unknown;
interface ReplicaUserConfiguration {
    applicationId?: string;
    clientToken: string;
}
export interface Configuration extends TransportConfiguration {
    beforeSend: GenericBeforeSendCallback | undefined;
    cookieOptions: CookieOptions;
    sampleRate: number;
    service: string | undefined;
    silentMultipleInit: boolean;
    eventRateLimiterThreshold: number;
    maxInternalMonitoringMessagesPerPage: number;
    batchBytesLimit: number;
    flushTimeout: number;
    maxBatchSize: number;
    maxMessageSize: number;
}
export declare function validateAndBuildConfiguration(initConfiguration: InitConfiguration): Configuration | undefined;
export declare function buildCookieOptions(initConfiguration: InitConfiguration): CookieOptions;
export {};
