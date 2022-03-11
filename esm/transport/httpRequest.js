// eslint-disable-next-line local-rules/disallow-side-effects
import { net } from 'electron';
import { display } from '@datadog/browser-core';
/**
 * Use POST request without content type to:
 * - avoid CORS preflight requests
 *
 * multiple elements are sent separated by \n in order
 * to be parsed correctly without content type header
 */
var HttpRequest = /** @class */ (function () {
    function HttpRequest(endpointBuilder) {
        this.endpointBuilder = endpointBuilder;
    }
    HttpRequest.prototype.send = function (data, reason) {
        display.log('flushing data for ', reason);
        var url = this.endpointBuilder.build();
        var request = net.request({
            method: 'POST',
            url: url,
        });
        request.setHeader('content-type', 'text/plain');
        request.on('response', function (res) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                return;
            }
            display.error("fail to flush with status: ".concat(res.statusCode));
        });
        request.on('error', function (err) {
            display.error('fail to flush', err);
        });
        request.write(data);
        request.end();
    };
    return HttpRequest;
}());
export { HttpRequest };
//# sourceMappingURL=httpRequest.js.map