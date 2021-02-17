"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const customTextEditor_1 = require("./customTextEditor");
function activate(context) {
    context.subscriptions.push(new customTextEditor_1.AbcTextEditorProvider(context).register());
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map