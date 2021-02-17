"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keychain = void 0;
const vscode = require("vscode");
const logger_1 = require("./logger");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
function getKeytar() {
    try {
        return require('keytar');
    }
    catch (err) {
        console.log(err);
    }
    return undefined;
}
const SERVICE_ID = `github.auth`;
class Keychain {
    constructor(context) {
        this.context = context;
    }
    async setToken(token) {
        try {
            return await this.context.secrets.store(SERVICE_ID, token);
        }
        catch (e) {
            // Ignore
            logger_1.default.error(`Setting token failed: ${e}`);
            const troubleshooting = localize('troubleshooting', "Troubleshooting Guide");
            const result = await vscode.window.showErrorMessage(localize('keychainWriteError', "Writing login information to the keychain failed with error '{0}'.", e.message), troubleshooting);
            if (result === troubleshooting) {
                vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/editor/settings-sync#_troubleshooting-keychain-issues'));
            }
        }
    }
    async getToken() {
        try {
            return await this.context.secrets.get(SERVICE_ID);
        }
        catch (e) {
            // Ignore
            logger_1.default.error(`Getting token failed: ${e}`);
            return Promise.resolve(undefined);
        }
    }
    async deleteToken() {
        try {
            return await this.context.secrets.delete(SERVICE_ID);
        }
        catch (e) {
            // Ignore
            logger_1.default.error(`Deleting token failed: ${e}`);
            return Promise.resolve(undefined);
        }
    }
    async tryMigrate() {
        try {
            const keytar = getKeytar();
            if (!keytar) {
                throw new Error('keytar unavailable');
            }
            const oldValue = await keytar.getPassword(`${vscode.env.uriScheme}-github.login`, 'account');
            if (oldValue) {
                await this.setToken(oldValue);
                await keytar.deletePassword(`${vscode.env.uriScheme}-github.login`, 'account');
            }
            return oldValue;
        }
        catch (_) {
            // Ignore
            return Promise.resolve(undefined);
        }
    }
}
exports.Keychain = Keychain;
//# sourceMappingURL=keychain.js.map