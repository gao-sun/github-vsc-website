"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = void 0;
const vscode = require("vscode");
const publish_1 = require("./publish");
const util_1 = require("./util");
function registerCommands(gitAPI) {
    const disposables = [];
    disposables.push(vscode.commands.registerCommand('github.publish', async () => {
        try {
            publish_1.publishRepository(gitAPI);
        }
        catch (err) {
            vscode.window.showErrorMessage(err.message);
        }
    }));
    return util_1.combinedDisposable(disposables);
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=commands.js.map