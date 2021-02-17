"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const simpleBrowserManager_1 = require("./simpleBrowserManager");
const localize = nls.loadMessageBundle();
const openApiCommand = 'simpleBrowser.api.open';
const showCommand = 'simpleBrowser.show';
const enabledHosts = new Set([
    'localhost',
    '127.0.0.1'
]);
const openerId = 'simpleBrowser.open';
function activate(context) {
    const manager = new simpleBrowserManager_1.SimpleBrowserManager(context.extensionUri);
    context.subscriptions.push(manager);
    context.subscriptions.push(vscode.commands.registerCommand(showCommand, async (url) => {
        if (!url) {
            url = await vscode.window.showInputBox({
                placeHolder: localize('simpleBrowser.show.placeholder', "https://example.com"),
                prompt: localize('simpleBrowser.show.prompt', "Enter url to visit")
            });
        }
        if (url) {
            manager.show(url);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand(openApiCommand, (url, showOptions) => {
        manager.show(url.toString(), showOptions);
    }));
    context.subscriptions.push(vscode.window.registerExternalUriOpener(openerId, {
        canOpenExternalUri(uri) {
            const originalUri = new URL(uri.toString());
            if (enabledHosts.has(originalUri.hostname)) {
                return isWeb()
                    ? vscode.ExternalUriOpenerPriority.Default
                    : vscode.ExternalUriOpenerPriority.Option;
            }
            return vscode.ExternalUriOpenerPriority.None;
        },
        openExternalUri(resolveUri) {
            return manager.show(resolveUri.toString(), {
                viewColumn: vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active
            });
        }
    }, {
        schemes: ['http', 'https'],
        label: localize('openTitle', "Open in simple browser"),
    }));
}
exports.activate = activate;
function isWeb() {
    // @ts-expect-error
    return typeof navigator !== 'undefined' && vscode.env.uiKind === vscode.UIKind.Web;
}
//# sourceMappingURL=extension.js.map