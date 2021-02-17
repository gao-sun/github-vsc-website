"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlToUri = void 0;
const vscode = require("vscode");
/**
 * Tries to convert an url into a vscode uri and returns undefined if this is not possible.
 * `url` can be absolute or relative.
*/
function urlToUri(url, base) {
    try {
        // `vscode.Uri.joinPath` cannot be used, since it understands
        // `src` as path, not as relative url. This is problematic for query args.
        const parsedUrl = new URL(url, base.toString());
        const uri = vscode.Uri.parse(parsedUrl.toString());
        return uri;
    }
    catch (e) {
        // Don't crash if `URL` cannot parse `src`.
        return undefined;
    }
}
exports.urlToUri = urlToUri;
//# sourceMappingURL=url.js.map