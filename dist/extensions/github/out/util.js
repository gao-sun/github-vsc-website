"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.combinedDisposable = exports.dispose = void 0;
const vscode = require("vscode");
function dispose(arg) {
    if (arg instanceof vscode.Disposable) {
        arg.dispose();
    }
    else {
        for (const disposable of arg) {
            disposable.dispose();
        }
    }
}
exports.dispose = dispose;
function combinedDisposable(disposables) {
    return {
        dispose() {
            dispose(disposables);
        }
    };
}
exports.combinedDisposable = combinedDisposable;
//# sourceMappingURL=util.js.map