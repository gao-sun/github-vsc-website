"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbcTextEditorProvider = exports.Testing = void 0;
const pLimit = require("p-limit");
const path = require("path");
const vscode = require("vscode");
const dispose_1 = require("./dispose");
var Testing;
(function (Testing) {
    Testing.abcEditorContentChangeCommand = '_abcEditor.contentChange';
    Testing.abcEditorTypeCommand = '_abcEditor.type';
})(Testing = exports.Testing || (exports.Testing = {}));
class AbcTextEditorProvider {
    constructor(context) {
        this.context = context;
    }
    register() {
        const provider = vscode.window.registerCustomEditorProvider(AbcTextEditorProvider.viewType, this);
        const commands = [];
        commands.push(vscode.commands.registerCommand(Testing.abcEditorTypeCommand, (content) => {
            var _a;
            (_a = this.activeEditor) === null || _a === void 0 ? void 0 : _a.testing_fakeInput(content);
        }));
        return vscode.Disposable.from(provider, ...commands);
    }
    async resolveCustomTextEditor(document, panel) {
        const editor = new AbcEditor(document, this.context.extensionPath, panel);
        this.activeEditor = editor;
        panel.onDidChangeViewState(({ webviewPanel }) => {
            if (this.activeEditor === editor && !webviewPanel.active) {
                this.activeEditor = undefined;
            }
            if (webviewPanel.active) {
                this.activeEditor = editor;
            }
        });
    }
}
exports.AbcTextEditorProvider = AbcTextEditorProvider;
AbcTextEditorProvider.viewType = 'testWebviewEditor.abc';
class AbcEditor extends dispose_1.Disposable {
    constructor(document, _extensionPath, panel) {
        super();
        this.document = document;
        this._extensionPath = _extensionPath;
        this.panel = panel;
        this._onDispose = this._register(new vscode.EventEmitter());
        this.onDispose = this._onDispose.event;
        this.limit = pLimit(1);
        this.syncedVersion = -1;
        panel.webview.options = {
            enableScripts: true,
        };
        panel.webview.html = this.html;
        this._register(vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document === this.document) {
                this.update();
            }
        }));
        this._register(panel.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'edit':
                    this.doEdit(message.value);
                    break;
                case 'didChangeContent':
                    vscode.commands.executeCommand(Testing.abcEditorContentChangeCommand, {
                        content: message.value,
                        source: document.uri,
                    });
                    break;
            }
        }));
        this._register(panel.onDidDispose(() => { this.dispose(); }));
        this.update();
    }
    testing_fakeInput(value) {
        this.panel.webview.postMessage({
            type: 'fakeInput',
            value: value,
        });
    }
    async doEdit(value) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(this.document.uri, this.document.validateRange(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(999999, 999999))), value);
        this.limit(() => {
            this.currentWorkspaceEdit = vscode.workspace.applyEdit(edit).then(() => {
                this.syncedVersion = this.document.version;
                this.currentWorkspaceEdit = undefined;
            });
            return this.currentWorkspaceEdit;
        });
    }
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._onDispose.fire();
        super.dispose();
    }
    get html() {
        const contentRoot = path.join(this._extensionPath, 'customEditorMedia');
        const scriptUri = vscode.Uri.file(path.join(contentRoot, 'textEditor.js'));
        const nonce = Date.now() + '';
        return /* html */ `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
				<title>Document</title>
			</head>
			<body>
				<textarea style="width: 300px; height: 300px;"></textarea>
				<script nonce=${nonce} src="${this.panel.webview.asWebviewUri(scriptUri)}"></script>
			</body>
			</html>`;
    }
    async update() {
        await this.currentWorkspaceEdit;
        if (this.isDisposed || this.syncedVersion >= this.document.version) {
            return;
        }
        this.panel.webview.postMessage({
            type: 'setValue',
            value: this.document.getText(),
        });
        this.syncedVersion = this.document.version;
    }
}
//# sourceMappingURL=customTextEditor.js.map