"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpRequest = void 0;
// eslint-disable-next-line local-rules/disallow-side-effects
var electron_1 = require("electron");
var browser_core_1 = require("@datadog/browser-core");
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
        browser_core_1.display.log('flushing data for ', reason);
        var url = this.endpointBuilder.build();
        var request = electron_1.net.request({
            method: 'POST',
            url: url,
        });
        request.setHeader('content-type', 'text/plain');
        request.on('response', function (res) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                return;
            }
            browser_core_1.display.error("fail to flush with status: ".concat(res.statusCode));
        });
        request.on('error', function (err) {
            browser_core_1.display.error('fail to flush', err);
        });
        request.write(data);
        request.end();
    };
    return HttpRequest;
}());
exports.HttpRequest = HttpRequest;
//# sourceMappingURL=httpRequest.js.map