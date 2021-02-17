"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const remoteSourceProvider_1 = require("./remoteSourceProvider");
const commands_1 = require("./commands");
const credentialProvider_1 = require("./credentialProvider");
const util_1 = require("./util");
const pushErrorHandler_1 = require("./pushErrorHandler");
function activate(context) {
    const disposables = new Set();
    context.subscriptions.push(util_1.combinedDisposable(disposables));
    const init = () => {
        try {
            const gitAPI = gitExtension.getAPI(1);
            disposables.add(commands_1.registerCommands(gitAPI));
            disposables.add(gitAPI.registerRemoteSourceProvider(new remoteSourceProvider_1.GithubRemoteSourceProvider(gitAPI)));
            disposables.add(new credentialProvider_1.GithubCredentialProviderManager(gitAPI));
            disposables.add(gitAPI.registerPushErrorHandler(new pushErrorHandler_1.GithubPushErrorHandler()));
        }
        catch (err) {
            console.error('Could not initialize GitHub extension');
            console.warn(err);
        }
    };
    const onDidChangeGitExtensionEnablement = (enabled) => {
        if (!enabled) {
            util_1.dispose(disposables);
            disposables.clear();
        }
        else {
            init();
        }
    };
    const gitExtension = vscode_1.extensions.getExtension('vscode.git').exports;
    context.subscriptions.push(gitExtension.onDidChangeEnablement(onDidChangeGitExtensionEnablement));
    onDidChangeGitExtensionEnablement(gitExtension.enabled);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map