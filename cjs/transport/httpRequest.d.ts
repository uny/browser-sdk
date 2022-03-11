import type { EndpointBuilder } from '../domain/configuration';
/**
 * Use POST request without content type to:
 * - avoid CORS preflight requests
 * - allow usage of sendBeacon
 *
 * multiple elements are sent separated by \n in order
 * to be parsed correctly without content type header
 */
export declare class HttpRequest {
    private endpointBuilder;
    private bytesLimit;
    constructor(endpointBuilder: EndpointBuilder, bytesLimit: number);
    send(data: string | FormData, size: number, flushReason?: string): void;
}
