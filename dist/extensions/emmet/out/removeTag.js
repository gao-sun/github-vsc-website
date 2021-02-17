"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTag = void 0;
const vscode = require("vscode");
const parseDocument_1 = require("./parseDocument");
const util_1 = require("./util");
function removeTag() {
    if (!util_1.validate(false) || !vscode.window.activeTextEditor) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    const document = editor.document;
    const rootNode = parseDocument_1.getRootNode(document, true);
    if (!rootNode) {
        return;
    }
    let finalRangesToRemove = editor.selections.reverse()
        .reduce((prev, selection) => prev.concat(getRangesToRemove(editor.document, rootNode, selection)), []);
    return editor.edit(editBuilder => {
        finalRangesToRemove.forEach(range => {
            editBuilder.replace(range, '');
        });
    });
}
exports.removeTag = removeTag;
/**
 * Calculates the ranges to remove, along with what to replace those ranges with.
 * It finds the node to remove based on the selection's start position
 * and then removes that node, reindenting the content in between.
 */
function getRangesToRemove(document, rootNode, selection) {
    const offset = document.offsetAt(selection.start);
    const nodeToUpdate = util_1.getHtmlFlatNode(document.getText(), rootNode, offset, true);
    if (!nodeToUpdate) {
        return [];
    }
    let openTagRange;
    if (nodeToUpdate.open) {
        openTagRange = util_1.offsetRangeToVsRange(document, nodeToUpdate.open.start, nodeToUpdate.open.end);
    }
    let closeTagRange;
    if (nodeToUpdate.close) {
        closeTagRange = util_1.offsetRangeToVsRange(document, nodeToUpdate.close.start, nodeToUpdate.close.end);
    }
    let rangesToRemove = [];
    if (openTagRange) {
        rangesToRemove.push(openTagRange);
        if (closeTagRange) {
            const indentAmountToRemove = calculateIndentAmountToRemove(document, openTagRange, closeTagRange);
            for (let i = openTagRange.start.line + 1; i < closeTagRange.start.line; i++) {
                rangesToRemove.push(new vscode.Range(i, 0, i, indentAmountToRemove));
            }
            rangesToRemove.push(closeTagRange);
        }
    }
    return rangesToRemove;
}
/**
 * Calculates the amount of indent to remove for getRangesToRemove.
 */
function calculateIndentAmountToRemove(document, openRange, closeRange) {
    const startLine = openRange.start.line;
    const endLine = closeRange.start.line;
    const startLineIndent = document.lineAt(startLine).firstNonWhitespaceCharacterIndex;
    const endLineIndent = document.lineAt(endLine).firstNonWhitespaceCharacterIndex;
    let contentIndent;
    for (let i = startLine + 1; i < endLine; i++) {
        const lineIndent = document.lineAt(i).firstNonWhitespaceCharacterIndex;
        contentIndent = !contentIndent ? lineIndent : Math.min(contentIndent, lineIndent);
    }
    let indentAmount = 0;
    if (contentIndent) {
        if (contentIndent < startLineIndent || contentIndent < endLineIndent) {
            indentAmount = 0;
        }
        else {
            indentAmount = Math.min(contentIndent - startLineIndent, contentIndent - endLineIndent);
        }
    }
    return indentAmount;
}
//# sourceMappingURL=removeTag.js.map