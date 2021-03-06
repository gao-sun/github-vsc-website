"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTag = void 0;
const vscode = require("vscode");
const util_1 = require("./util");
const parseDocument_1 = require("./parseDocument");
function updateTag(tagName) {
    if (!util_1.validate(false) || !vscode.window.activeTextEditor) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    const document = editor.document;
    const rootNode = parseDocument_1.getRootNode(document, true);
    if (!rootNode) {
        return;
    }
    const rangesToUpdate = editor.selections.reverse()
        .reduce((prev, selection) => prev.concat(getRangesToUpdate(document, selection, rootNode)), []);
    return editor.edit(editBuilder => {
        rangesToUpdate.forEach(range => {
            editBuilder.replace(range, tagName);
        });
    });
}
exports.updateTag = updateTag;
function getRangesFromNode(node, document) {
    let ranges = [];
    if (node.open) {
        const start = document.positionAt(node.open.start);
        ranges.push(new vscode.Range(start.translate(0, 1), start.translate(0, 1).translate(0, node.name.length)));
    }
    if (node.close) {
        const endTagStart = document.positionAt(node.close.start);
        const end = document.positionAt(node.close.end);
        ranges.push(new vscode.Range(endTagStart.translate(0, 2), end.translate(0, -1)));
    }
    return ranges;
}
function getRangesToUpdate(document, selection, rootNode) {
    const documentText = document.getText();
    const offset = document.offsetAt(selection.start);
    const nodeToUpdate = util_1.getHtmlFlatNode(documentText, rootNode, offset, true);
    if (!nodeToUpdate) {
        return [];
    }
    return getRangesFromNode(nodeToUpdate, document);
}
//# sourceMappingURL=updateTag.js.map