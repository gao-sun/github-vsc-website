"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleBrowserView = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const dispose_1 = require("./dispose");
const localize = nls.loadMessageBundle();
class SimpleBrowserView extends dispose_1.Disposable {
    constructor(extensionUri, url, showOptions) {
        var _a;
        super();
        this.extensionUri = extensionUri;
        this._onDidDispose = this._register(new vscode.EventEmitter());
        this.onDispose = this._onDidDispose.event;
        this._webviewPanel = this._register(vscode.window.createWebviewPanel(SimpleBrowserView.viewType, SimpleBrowserView.title, {
            viewColumn: (_a = showOptions === null || showOptions === void 0 ? void 0 : showOptions.viewColumn) !== null && _a !== void 0 ? _a : vscode.ViewColumn.Active,
            preserveFocus: showOptions === null || showOptions === void 0 ? void 0 : showOptions.preserveFocus
        }, {
            enableScripts: true,
            retainContextWhenHidden: true,
        }));
        this._register(this._webviewPanel.webview.onDidReceiveMessage(e => {
            switch (e.type) {
                case 'openExternal':
                    try {
                        const url = vscode.Uri.parse(e.url);
                        vscode.env.openExternal(url);
                    }
                    catch (_a) {
                        // Noop
                    }
                    break;
            }
        }));
        this._register(this._webviewPanel.onDidDispose(() => {
            this.dispose();
        }));
        this._register(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('simpleBrowser.focusLockIndicator.enabled')) {
                const configuration = vscode.workspace.getConfiguration('simpleBrowser');
                this._webviewPanel.webview.postMessage({
                    type: 'didChangeFocusLockIndicatorEnabled',
                    focusLockEnabled: configuration.get('focusLockIndicator.enabled', true)
                });
            }
        }));
        this.show(url);
    }
    dispose() {
        this._onDidDispose.fire();
        super.dispose();
    }
    show(url, options) {
        this._webviewPanel.webview.html = this.getHtml(url);
        this._webviewPanel.reveal(options === null || options === void 0 ? void 0 : options.viewColumn, options === null || options === void 0 ? void 0 : options.preserveFocus);
    }
    getHtml(url) {
        const configuration = vscode.workspace.getConfiguration('simpleBrowser');
        const nonce = new Date().getTime() + '' + new Date().getMilliseconds();
        const mainJs = this.extensionResourceUrl('media', 'index.js');
        const mainCss = this.extensionResourceUrl('media', 'main.css');
        const codiconsUri = this.extensionResourceUrl('node_modules', 'vscode-codicons', 'dist', 'codicon.css');
        const codiconsFontUri = this.extensionResourceUrl('node_modules', 'vscode-codicons', 'dist', 'codicon.ttf');
        return /* html */ `<!DOCTYPE html>
			<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">

				<meta http-equiv="Content-Security-Policy" content="
					default-src 'none';
					font-src ${codiconsFontUri};
					style-src ${this._webviewPanel.webview.cspSource};
					script-src 'nonce-${nonce}';
					frame-src *;
					">

				<meta id="simple-browser-settings" data-settings="${escapeAttribute(JSON.stringify({
            url: url,
            focusLockEnabled: configuration.get('focusLockIndicator.enabled', true)
        }))}">

				<link rel="stylesheet" type="text/css" href="${mainCss}">
				<link rel="stylesheet" type="text/css" href="${codiconsUri}">
			</head>
			<body>
				<header class="header">
					<nav class="controls">
						<button
							title="${localize('control.back.title', "Back")}"
							class="back-button icon"><i class="codicon codicon-arrow-left"></i></button>

						<button
							title="${localize('control.forward.title', "Forward")}"
							class="forward-button icon"><i class="codicon codicon-arrow-right"></i></button>

						<button
							title="${localize('control.reload.title', "Reload")}"
							class="reload-button icon"><i class="codicon codicon-refresh"></i></button>
					</nav>

					<input class="url-input" type="text" value=${url}>

					<nav class="controls">
						<button
							title="${localize('control.openExternal.title', "Open in browser")}"
							class="open-external-button icon"><i class="codicon codicon-link-external"></i></button>
					</nav>
				</header>
				<div class="content">
					<div class="iframe-focused-alert">${localize('view.iframe-focused', "Focus Lock")}</div>
					<iframe sandbox="allow-scripts allow-forms allow-same-origin"></iframe>
				</div>

				<script src="${mainJs}" nonce="${nonce}"></script>
			</body>
			</html>`;
    }
    extensionResourceUrl(...parts) {
        return this._webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...parts));
    }
}
exports.SimpleBrowserView = SimpleBrowserView;
SimpleBrowserView.viewType = 'simpleBrowser.view';
SimpleBrowserView.title = localize('view.title', "Simple Browser");
function escapeAttribute(value) {
    return value.toString().replace(/"/g, '&quot;');
}
//# sourceMappingURL=simpleBrowserView.js.map