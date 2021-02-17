"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.disposeAll = exports.closeAllEditors = exports.randomFilePath = void 0;
const vscode = require("vscode");
function randomFilePath(args) {
    const fileName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
    return vscode.Uri.joinPath(args.root, fileName + args.ext);
}
exports.randomFilePath = randomFilePath;
function closeAllEditors() {
    return vscode.commands.executeCommand('workbench.action.closeAllEditors');
}
exports.closeAllEditors = closeAllEditors;
function disposeAll(disposables) {
    vscode.Disposable.from(...disposables).dispose();
}
exports.disposeAll = disposeAll;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.delay = delay;
//# sourceMappingURL=utils.js.map