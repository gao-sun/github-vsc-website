"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleBrowserManager = void 0;
const simpleBrowserView_1 = require("./simpleBrowserView");
class SimpleBrowserManager {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    dispose() {
        var _a;
        (_a = this._activeView) === null || _a === void 0 ? void 0 : _a.dispose();
        this._activeView = undefined;
    }
    show(url, options) {
        if (this._activeView) {
            this._activeView.show(url, options);
        }
        else {
            const view = new simpleBrowserView_1.SimpleBrowserView(this.extensionUri, url, options);
            view.onDispose(() => {
                if (this._activeView === view) {
                    this._activeView = undefined;
                }
            });
            this._activeView = view;
        }
    }
}
exports.SimpleBrowserManager = SimpleBrowserManager;
//# sourceMappingURL=simpleBrowserManager.js.map