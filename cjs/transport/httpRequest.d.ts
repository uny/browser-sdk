import type { EndpointBuilder } from '@datadog/browser-core';
/**
 * Use POST request without content type to:
 * - avoid CORS preflight requests
 *
 * multiple elements are sent separated by \n in order
 * to be parsed correctly without content type header
 */
export declare class HttpRequest {
    private endpointBuilder;
    constructor(endpointBuilder: EndpointBuilder);
    send(data: string, reason?: string): void;
}
