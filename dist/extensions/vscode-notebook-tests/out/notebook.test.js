"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.timeoutAsync = void 0;
require("mocha");
const assert = require("assert");
const vscode = require("vscode");
const utils_1 = require("./utils");
function timeoutAsync(n) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, n);
    });
}
exports.timeoutAsync = timeoutAsync;
function once(event) {
    return (listener, thisArgs = null, disposables) => {
        // we need this, in case the event fires during the listener call
        let didFire = false;
        let result;
        result = event(e => {
            if (didFire) {
                return;
            }
            else if (result) {
                result.dispose();
            }
            else {
                didFire = true;
            }
            return listener.call(thisArgs, e);
        }, null, disposables);
        if (didFire) {
            result.dispose();
        }
        return result;
    };
}
exports.once = once;
async function getEventOncePromise(event) {
    return new Promise((resolve, _reject) => {
        once(event)((result) => resolve(result));
    });
}
// Since `workbench.action.splitEditor` command does await properly
// Notebook editor/document events are not guaranteed to be sent to the ext host when promise resolves
// The workaround here is waiting for the first visible notebook editor change event.
async function splitEditor() {
    const once = getEventOncePromise(vscode.window.onDidChangeVisibleNotebookEditors);
    await vscode.commands.executeCommand('workbench.action.splitEditor');
    await once;
}
async function saveFileAndCloseAll(resource) {
    const documentClosed = new Promise((resolve, _reject) => {
        const d = vscode.notebook.onDidCloseNotebookDocument(e => {
            if (e.uri.toString() === resource.toString()) {
                d.dispose();
                resolve();
            }
        });
    });
    await vscode.commands.executeCommand('workbench.action.files.save');
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await documentClosed;
}
async function saveAllFilesAndCloseAll(resource) {
    const documentClosed = new Promise((resolve, _reject) => {
        if (!resource) {
            return resolve();
        }
        const d = vscode.notebook.onDidCloseNotebookDocument(e => {
            if (e.uri.toString() === resource.toString()) {
                d.dispose();
                resolve();
            }
        });
    });
    await vscode.commands.executeCommand('workbench.action.files.saveAll');
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await documentClosed;
}
function assertInitalState() {
    // no-op unless we figure out why some documents are opened after the editor is closed
    // assert.equal(vscode.window.activeNotebookEditor, undefined);
    // assert.equal(vscode.notebook.notebookDocuments.length, 0);
    // assert.equal(vscode.notebook.visibleNotebookEditors.length, 0);
}
suite('Notebook API tests', () => {
    // test.only('crash', async function () {
    // 	for (let i = 0; i < 200; i++) {
    // 		let resource = vscode.Uri.file(join(vscode.workspace.rootPath || '', './first.vsctestnb'));
    // 		await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 		await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    // 		resource = vscode.Uri.file(join(vscode.workspace.rootPath || '', './empty.vsctestnb'));
    // 		await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 		await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    // 	}
    // });
    // test.only('crash', async function () {
    // 	for (let i = 0; i < 200; i++) {
    // 		let resource = vscode.Uri.file(join(vscode.workspace.rootPath || '', './first.vsctestnb'));
    // 		await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 		await vscode.commands.executeCommand('workbench.action.files.save');
    // 		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // 		resource = vscode.Uri.file(join(vscode.workspace.rootPath || '', './empty.vsctestnb'));
    // 		await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 		await vscode.commands.executeCommand('workbench.action.files.save');
    // 		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // 	}
    // });
    test('document open/close event', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        const firstDocumentOpen = getEventOncePromise(vscode.notebook.onDidOpenNotebookDocument);
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await firstDocumentOpen;
        const firstDocumentClose = getEventOncePromise(vscode.notebook.onDidCloseNotebookDocument);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await firstDocumentClose;
    });
    test('notebook open/close, all cell-documents are ready', async function () {
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        const p = getEventOncePromise(vscode.notebook.onDidOpenNotebookDocument).then(notebook => {
            for (let cell of notebook.cells) {
                const doc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === cell.uri.toString());
                assert.ok(doc);
                assert.strictEqual(doc === cell.document, true);
                assert.strictEqual(doc === null || doc === void 0 ? void 0 : doc.languageId, cell.language);
                assert.strictEqual(doc === null || doc === void 0 ? void 0 : doc.isDirty, false);
                assert.strictEqual(doc === null || doc === void 0 ? void 0 : doc.isClosed, false);
            }
        });
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await p;
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('notebook open/close, notebook ready when cell-document open event is fired', async function () {
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        let didHappen = false;
        const p = getEventOncePromise(vscode.workspace.onDidOpenTextDocument).then(doc => {
            if (doc.uri.scheme !== 'vscode-notebook-cell') {
                return;
            }
            const notebook = vscode.notebook.notebookDocuments.find(notebook => {
                const cell = notebook.cells.find(cell => cell.document === doc);
                return Boolean(cell);
            });
            assert.ok(notebook, `notebook for cell ${doc.uri} NOT found`);
            didHappen = true;
        });
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await p;
        assert.strictEqual(didHappen, true);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('shared document in notebook editors', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        let counter = 0;
        const disposables = [];
        disposables.push(vscode.notebook.onDidOpenNotebookDocument(() => {
            counter++;
        }));
        disposables.push(vscode.notebook.onDidCloseNotebookDocument(() => {
            counter--;
        }));
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(counter, 1);
        await splitEditor();
        assert.equal(counter, 1);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        assert.equal(counter, 0);
        disposables.forEach(d => d.dispose());
    });
    test('editor open/close event', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        const firstEditorOpen = getEventOncePromise(vscode.window.onDidChangeVisibleNotebookEditors);
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await firstEditorOpen;
        const firstEditorClose = getEventOncePromise(vscode.window.onDidChangeVisibleNotebookEditors);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await firstEditorClose;
    });
    test('editor open/close event 2', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        let count = 0;
        const disposables = [];
        disposables.push(vscode.window.onDidChangeVisibleNotebookEditors(() => {
            count = vscode.window.visibleNotebookEditors.length;
        }));
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(count, 1);
        await splitEditor();
        assert.equal(count, 2);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        assert.equal(count, 0);
    });
    test('editor editing event 2', async function () {
        var _a, _b;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const cellsChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        const cellChangeEventRet = await cellsChangeEvent;
        assert.equal(cellChangeEventRet.document, (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document);
        assert.equal(cellChangeEventRet.changes.length, 1);
        assert.deepEqual(cellChangeEventRet.changes[0], {
            start: 1,
            deletedCount: 0,
            deletedItems: [],
            items: [
                vscode.window.activeNotebookEditor.document.cells[1]
            ]
        });
        const secondCell = vscode.window.activeNotebookEditor.document.cells[1];
        const moveCellEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        await vscode.commands.executeCommand('notebook.cell.moveUp');
        const moveCellEventRet = await moveCellEvent;
        assert.deepEqual(moveCellEventRet, {
            document: vscode.window.activeNotebookEditor.document,
            changes: [
                {
                    start: 1,
                    deletedCount: 1,
                    deletedItems: [secondCell],
                    items: []
                },
                {
                    start: 0,
                    deletedCount: 0,
                    deletedItems: [],
                    items: [(_b = vscode.window.activeNotebookEditor) === null || _b === void 0 ? void 0 : _b.document.cells[0]]
                }
            ]
        });
        const cellOutputChange = getEventOncePromise(vscode.notebook.onDidChangeCellOutputs);
        await vscode.commands.executeCommand('notebook.cell.execute');
        const cellOutputsAddedRet = await cellOutputChange;
        assert.deepEqual(cellOutputsAddedRet, {
            document: vscode.window.activeNotebookEditor.document,
            cells: [vscode.window.activeNotebookEditor.document.cells[0]]
        });
        assert.equal(cellOutputsAddedRet.cells[0].outputs.length, 1);
        const cellOutputClear = getEventOncePromise(vscode.notebook.onDidChangeCellOutputs);
        await vscode.commands.executeCommand('notebook.cell.clearOutputs');
        const cellOutputsCleardRet = await cellOutputClear;
        assert.deepEqual(cellOutputsCleardRet, {
            document: vscode.window.activeNotebookEditor.document,
            cells: [vscode.window.activeNotebookEditor.document.cells[0]]
        });
        assert.equal(cellOutputsAddedRet.cells[0].outputs.length, 0);
        // const cellChangeLanguage = getEventOncePromise<vscode.NotebookCellLanguageChangeEvent>(vscode.notebook.onDidChangeCellLanguage);
        // await vscode.commands.executeCommand('notebook.cell.changeToMarkdown');
        // const cellChangeLanguageRet = await cellChangeLanguage;
        // assert.deepEqual(cellChangeLanguageRet, {
        // 	document: vscode.window.activeNotebookEditor!.document,
        // 	cells: vscode.window.activeNotebookEditor!.document.cells[0],
        // 	language: 'markdown'
        // });
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('editor move cell event', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
        await vscode.commands.executeCommand('notebook.focusTop');
        const activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 0);
        const moveChange = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        await vscode.commands.executeCommand('notebook.cell.moveDown');
        const ret = await moveChange;
        assert.deepEqual(ret, {
            document: (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document,
            changes: [
                {
                    start: 0,
                    deletedCount: 1,
                    deletedItems: [activeCell],
                    items: []
                },
                {
                    start: 1,
                    deletedCount: 0,
                    deletedItems: [],
                    items: [activeCell]
                }
            ]
        });
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const firstEditor = vscode.window.activeNotebookEditor;
        assert.equal(firstEditor === null || firstEditor === void 0 ? void 0 : firstEditor.document.cells.length, 1);
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('notebook editor active/visible', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const firstEditor = vscode.window.activeNotebookEditor;
        assert.strictEqual(firstEditor && vscode.window.visibleNotebookEditors.indexOf(firstEditor) >= 0, true);
        await splitEditor();
        const secondEditor = vscode.window.activeNotebookEditor;
        assert.strictEqual(secondEditor && vscode.window.visibleNotebookEditors.indexOf(secondEditor) >= 0, true);
        assert.notStrictEqual(firstEditor, secondEditor);
        assert.strictEqual(firstEditor && vscode.window.visibleNotebookEditors.indexOf(firstEditor) >= 0, true);
        assert.equal(vscode.window.visibleNotebookEditors.length, 2);
        const untitledEditorChange = getEventOncePromise(vscode.window.onDidChangeActiveNotebookEditor);
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
        await untitledEditorChange;
        assert.strictEqual(firstEditor && vscode.window.visibleNotebookEditors.indexOf(firstEditor) >= 0, true);
        assert.notStrictEqual(firstEditor, vscode.window.activeNotebookEditor);
        assert.strictEqual(secondEditor && vscode.window.visibleNotebookEditors.indexOf(secondEditor) < 0, true);
        assert.notStrictEqual(secondEditor, vscode.window.activeNotebookEditor);
        assert.equal(vscode.window.visibleNotebookEditors.length, 1);
        const activeEditorClose = getEventOncePromise(vscode.window.onDidChangeActiveNotebookEditor);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await activeEditorClose;
        assert.strictEqual(secondEditor, vscode.window.activeNotebookEditor);
        assert.equal(vscode.window.visibleNotebookEditors.length, 2);
        assert.strictEqual(secondEditor && vscode.window.visibleNotebookEditors.indexOf(secondEditor) >= 0, true);
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('notebook active editor change', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        const firstEditorOpen = getEventOncePromise(vscode.window.onDidChangeActiveNotebookEditor);
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await firstEditorOpen;
        const firstEditorDeactivate = getEventOncePromise(vscode.window.onDidChangeActiveNotebookEditor);
        await vscode.commands.executeCommand('workbench.action.splitEditor');
        await firstEditorDeactivate;
        await saveFileAndCloseAll(resource);
    });
    test('edit API (replaceCells)', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const cellsChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        await vscode.window.activeNotebookEditor.edit(editBuilder => {
            editBuilder.replaceCells(1, 0, [{ cellKind: vscode.CellKind.Code, language: 'javascript', source: 'test 2', outputs: [], metadata: undefined }]);
        });
        const cellChangeEventRet = await cellsChangeEvent;
        assert.strictEqual(cellChangeEventRet.document === ((_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document), true);
        assert.strictEqual(cellChangeEventRet.document.isDirty, true);
        assert.strictEqual(cellChangeEventRet.changes.length, 1);
        assert.strictEqual(cellChangeEventRet.changes[0].start, 1);
        assert.strictEqual(cellChangeEventRet.changes[0].deletedCount, 0);
        assert.strictEqual(cellChangeEventRet.changes[0].items[0] === vscode.window.activeNotebookEditor.document.cells[1], true);
        await saveAllFilesAndCloseAll(resource);
    });
    test('edit API (replaceOutput, USE NotebookCellOutput-type)', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await vscode.window.activeNotebookEditor.edit(editBuilder => {
            editBuilder.replaceCellOutput(0, [new vscode.NotebookCellOutput([
                    new vscode.NotebookCellOutputItem('application/foo', 'bar'),
                    new vscode.NotebookCellOutputItem('application/json', { data: true }, { metadata: true }),
                ])]);
        });
        const document = (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document;
        assert.strictEqual(document.isDirty, true);
        assert.strictEqual(document.cells.length, 1);
        assert.strictEqual(document.cells[0].outputs.length, 1);
        // consuming is OLD api (for now)
        const [output] = document.cells[0].outputs;
        assert.strictEqual(output.outputKind, vscode.CellOutputKind.Rich);
        assert.strictEqual(output.data['application/foo'], 'bar');
        assert.deepStrictEqual(output.data['application/json'], { data: true });
        assert.deepStrictEqual(output.metadata, { custom: { 'application/json': { metadata: true } } });
        await saveAllFilesAndCloseAll(undefined);
    });
    test('edit API (replaceOutput)', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await vscode.window.activeNotebookEditor.edit(editBuilder => {
            editBuilder.replaceCellOutput(0, [{ outputKind: vscode.CellOutputKind.Rich, data: { foo: 'bar' } }]);
        });
        const document = (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document;
        assert.strictEqual(document.isDirty, true);
        assert.strictEqual(document.cells.length, 1);
        assert.strictEqual(document.cells[0].outputs.length, 1);
        assert.strictEqual(document.cells[0].outputs[0].outputKind, vscode.CellOutputKind.Rich);
        await saveAllFilesAndCloseAll(undefined);
    });
    test('edit API (replaceOutput, event)', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const outputChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeCellOutputs);
        await vscode.window.activeNotebookEditor.edit(editBuilder => {
            editBuilder.replaceCellOutput(0, [{ outputKind: vscode.CellOutputKind.Rich, data: { foo: 'bar' } }]);
        });
        const value = await outputChangeEvent;
        assert.strictEqual(value.document === ((_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document), true);
        assert.strictEqual(value.document.isDirty, true);
        assert.strictEqual(value.cells.length, 1);
        assert.strictEqual(value.cells[0].outputs.length, 1);
        assert.strictEqual(value.cells[0].outputs[0].outputKind, vscode.CellOutputKind.Rich);
        await saveAllFilesAndCloseAll(undefined);
    });
    test('edit API (replaceMetadata)', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await vscode.window.activeNotebookEditor.edit(editBuilder => {
            editBuilder.replaceCellMetadata(0, { inputCollapsed: true, executionOrder: 17 });
        });
        const document = (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document;
        assert.strictEqual(document.cells.length, 1);
        assert.strictEqual(document.cells[0].metadata.executionOrder, 17);
        assert.strictEqual(document.cells[0].metadata.inputCollapsed, true);
        assert.strictEqual(document.isDirty, true);
        await saveFileAndCloseAll(resource);
    });
    test('edit API (replaceMetadata, event)', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const event = getEventOncePromise(vscode.notebook.onDidChangeCellMetadata);
        await vscode.window.activeNotebookEditor.edit(editBuilder => {
            editBuilder.replaceCellMetadata(0, { inputCollapsed: true, executionOrder: 17 });
        });
        const data = await event;
        assert.strictEqual(data.document, (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document);
        assert.strictEqual(data.cell.metadata.executionOrder, 17);
        assert.strictEqual(data.cell.metadata.inputCollapsed, true);
        assert.strictEqual(data.document.isDirty, true);
        await saveFileAndCloseAll(resource);
    });
    test('workspace edit API (replaceCells)', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const { document } = vscode.window.activeNotebookEditor;
        assert.strictEqual(document.cells.length, 1);
        // inserting two new cells
        {
            const edit = new vscode.WorkspaceEdit();
            edit.replaceNotebookCells(document.uri, 0, 0, [{
                    cellKind: vscode.CellKind.Markdown,
                    language: 'markdown',
                    metadata: undefined,
                    outputs: [],
                    source: 'new_markdown'
                }, {
                    cellKind: vscode.CellKind.Code,
                    language: 'fooLang',
                    metadata: undefined,
                    outputs: [],
                    source: 'new_code'
                }]);
            const success = await vscode.workspace.applyEdit(edit);
            assert.strictEqual(success, true);
        }
        assert.strictEqual(document.cells.length, 3);
        assert.strictEqual(document.cells[0].document.getText(), 'new_markdown');
        assert.strictEqual(document.cells[1].document.getText(), 'new_code');
        // deleting cell 1 and 3
        {
            const edit = new vscode.WorkspaceEdit();
            edit.replaceNotebookCells(document.uri, 0, 1, []);
            edit.replaceNotebookCells(document.uri, 2, 3, []);
            const success = await vscode.workspace.applyEdit(edit);
            assert.strictEqual(success, true);
        }
        assert.strictEqual(document.cells.length, 1);
        assert.strictEqual(document.cells[0].document.getText(), 'new_code');
        // replacing all cells
        {
            const edit = new vscode.WorkspaceEdit();
            edit.replaceNotebookCells(document.uri, 0, 1, [{
                    cellKind: vscode.CellKind.Markdown,
                    language: 'markdown',
                    metadata: undefined,
                    outputs: [],
                    source: 'new2_markdown'
                }, {
                    cellKind: vscode.CellKind.Code,
                    language: 'fooLang',
                    metadata: undefined,
                    outputs: [],
                    source: 'new2_code'
                }]);
            const success = await vscode.workspace.applyEdit(edit);
            assert.strictEqual(success, true);
        }
        assert.strictEqual(document.cells.length, 2);
        assert.strictEqual(document.cells[0].document.getText(), 'new2_markdown');
        assert.strictEqual(document.cells[1].document.getText(), 'new2_code');
        // remove all cells
        {
            const edit = new vscode.WorkspaceEdit();
            edit.replaceNotebookCells(document.uri, 0, document.cells.length, []);
            const success = await vscode.workspace.applyEdit(edit);
            assert.strictEqual(success, true);
        }
        assert.strictEqual(document.cells.length, 0);
        await saveFileAndCloseAll(resource);
    });
    test('workspace edit API (replaceCells, event)', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const { document } = vscode.window.activeNotebookEditor;
        assert.strictEqual(document.cells.length, 1);
        const edit = new vscode.WorkspaceEdit();
        edit.replaceNotebookCells(document.uri, 0, 0, [{
                cellKind: vscode.CellKind.Markdown,
                language: 'markdown',
                metadata: undefined,
                outputs: [],
                source: 'new_markdown'
            }, {
                cellKind: vscode.CellKind.Code,
                language: 'fooLang',
                metadata: undefined,
                outputs: [],
                source: 'new_code'
            }]);
        const event = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        const success = await vscode.workspace.applyEdit(edit);
        assert.strictEqual(success, true);
        const data = await event;
        // check document
        assert.strictEqual(document.cells.length, 3);
        assert.strictEqual(document.cells[0].document.getText(), 'new_markdown');
        assert.strictEqual(document.cells[1].document.getText(), 'new_code');
        // check event data
        assert.strictEqual(data.document === document, true);
        assert.strictEqual(data.changes.length, 1);
        assert.strictEqual(data.changes[0].deletedCount, 0);
        assert.strictEqual(data.changes[0].deletedItems.length, 0);
        assert.strictEqual(data.changes[0].items.length, 2);
        assert.strictEqual(data.changes[0].items[0], document.cells[0]);
        assert.strictEqual(data.changes[0].items[1], document.cells[1]);
        await saveFileAndCloseAll(resource);
    });
    test('edit API batch edits', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const cellsChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        const cellMetadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeCellMetadata);
        const version = vscode.window.activeNotebookEditor.document.version;
        await vscode.window.activeNotebookEditor.edit(editBuilder => {
            editBuilder.replaceCells(1, 0, [{ cellKind: vscode.CellKind.Code, language: 'javascript', source: 'test 2', outputs: [], metadata: undefined }]);
            editBuilder.replaceCellMetadata(0, { runnable: false });
        });
        await cellsChangeEvent;
        await cellMetadataChangeEvent;
        assert.strictEqual(version + 1, vscode.window.activeNotebookEditor.document.version);
        await saveAllFilesAndCloseAll(resource);
    });
    test('edit API batch edits undo/redo', async function () {
        var _a, _b, _c, _d;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const cellsChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        const cellMetadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeCellMetadata);
        const version = vscode.window.activeNotebookEditor.document.version;
        await vscode.window.activeNotebookEditor.edit(editBuilder => {
            editBuilder.replaceCells(1, 0, [{ cellKind: vscode.CellKind.Code, language: 'javascript', source: 'test 2', outputs: [], metadata: undefined }]);
            editBuilder.replaceCellMetadata(0, { runnable: false });
        });
        await cellsChangeEvent;
        await cellMetadataChangeEvent;
        assert.strictEqual(vscode.window.activeNotebookEditor.document.cells.length, 2);
        assert.strictEqual((_b = (_a = vscode.window.activeNotebookEditor.document.cells[0]) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.runnable, false);
        assert.strictEqual(version + 1, vscode.window.activeNotebookEditor.document.version);
        await vscode.commands.executeCommand('undo');
        assert.strictEqual(version + 2, vscode.window.activeNotebookEditor.document.version);
        assert.strictEqual((_d = (_c = vscode.window.activeNotebookEditor.document.cells[0]) === null || _c === void 0 ? void 0 : _c.metadata) === null || _d === void 0 ? void 0 : _d.runnable, undefined);
        assert.strictEqual(vscode.window.activeNotebookEditor.document.cells.length, 1);
        await saveAllFilesAndCloseAll(resource);
    });
    test('initialzation should not emit cell change events.', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        let count = 0;
        const disposables = [];
        disposables.push(vscode.notebook.onDidChangeNotebookCells(() => {
            count++;
        }));
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(count, 0);
        disposables.forEach(d => d.dispose());
        await saveFileAndCloseAll(resource);
    });
});
suite('notebook workflow', () => {
    test('notebook open', async function () {
        var _a, _b, _c;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), 'test');
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        assert.equal((_c = vscode.window.activeNotebookEditor.selection) === null || _c === void 0 ? void 0 : _c.document.getText(), '');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
        const activeCell = vscode.window.activeNotebookEditor.selection;
        assert.notEqual(vscode.window.activeNotebookEditor.selection, undefined);
        assert.equal(activeCell.document.getText(), '');
        assert.equal(vscode.window.activeNotebookEditor.document.cells.length, 3);
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 1);
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
    test('notebook cell actions', async function () {
        var _a, _b, _c;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), 'test');
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        // ---- insert cell below and focus ---- //
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        assert.equal((_c = vscode.window.activeNotebookEditor.selection) === null || _c === void 0 ? void 0 : _c.document.getText(), '');
        // ---- insert cell above and focus ---- //
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
        let activeCell = vscode.window.activeNotebookEditor.selection;
        assert.notEqual(vscode.window.activeNotebookEditor.selection, undefined);
        assert.equal(activeCell.document.getText(), '');
        assert.equal(vscode.window.activeNotebookEditor.document.cells.length, 3);
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 1);
        // ---- focus bottom ---- //
        await vscode.commands.executeCommand('notebook.focusBottom');
        activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 2);
        // ---- focus top and then copy down ---- //
        await vscode.commands.executeCommand('notebook.focusTop');
        activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 0);
        await vscode.commands.executeCommand('notebook.cell.copyDown');
        activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 1);
        assert.equal(activeCell === null || activeCell === void 0 ? void 0 : activeCell.document.getText(), 'test');
        await vscode.commands.executeCommand('notebook.cell.delete');
        activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 1);
        assert.equal(activeCell === null || activeCell === void 0 ? void 0 : activeCell.document.getText(), '');
        // ---- focus top and then copy up ---- //
        await vscode.commands.executeCommand('notebook.focusTop');
        await vscode.commands.executeCommand('notebook.cell.copyUp');
        assert.equal(vscode.window.activeNotebookEditor.document.cells.length, 4);
        assert.equal(vscode.window.activeNotebookEditor.document.cells[0].document.getText(), 'test');
        assert.equal(vscode.window.activeNotebookEditor.document.cells[1].document.getText(), 'test');
        assert.equal(vscode.window.activeNotebookEditor.document.cells[2].document.getText(), '');
        assert.equal(vscode.window.activeNotebookEditor.document.cells[3].document.getText(), '');
        activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 0);
        // ---- move up and down ---- //
        await vscode.commands.executeCommand('notebook.cell.moveDown');
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(vscode.window.activeNotebookEditor.selection), 1, `first move down, active cell ${vscode.window.activeNotebookEditor.selection.uri.toString()}, ${vscode.window.activeNotebookEditor.selection.document.getText()}`);
        // await vscode.commands.executeCommand('notebook.cell.moveDown');
        // activeCell = vscode.window.activeNotebookEditor!.selection;
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells.indexOf(activeCell!), 2,
        // 	`second move down, active cell ${vscode.window.activeNotebookEditor!.selection!.uri.toString()}, ${vscode.window.activeNotebookEditor!.selection!.document.getText()}`);
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells[0].document.getText(), 'test');
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells[1].document.getText(), '');
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells[2].document.getText(), 'test');
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells[3].document.getText(), '');
        // ---- ---- //
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
    test('notebook join cells', async function () {
        var _a, _b, _c, _d;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), 'test');
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        assert.equal((_c = vscode.window.activeNotebookEditor.selection) === null || _c === void 0 ? void 0 : _c.document.getText(), '');
        const edit = new vscode.WorkspaceEdit();
        edit.insert(vscode.window.activeNotebookEditor.selection.uri, new vscode.Position(0, 0), 'var abc = 0;');
        await vscode.workspace.applyEdit(edit);
        const cellsChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        await vscode.commands.executeCommand('notebook.cell.joinAbove');
        await cellsChangeEvent;
        assert.deepEqual((_d = vscode.window.activeNotebookEditor.selection) === null || _d === void 0 ? void 0 : _d.document.getText().split(/\r\n|\r|\n/), ['test', 'var abc = 0;']);
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
    test('move cells will not recreate cells in ExtHost', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
        await vscode.commands.executeCommand('notebook.focusTop');
        const activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 0);
        await vscode.commands.executeCommand('notebook.cell.moveDown');
        await vscode.commands.executeCommand('notebook.cell.moveDown');
        const newActiveCell = vscode.window.activeNotebookEditor.selection;
        assert.deepEqual(activeCell, newActiveCell);
        await saveFileAndCloseAll(resource);
        // TODO@rebornix, there are still some events order issue.
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells.indexOf(newActiveCell!), 2);
    });
    // test.only('document metadata is respected', async function () {
    // 	const resource = await createRandomFile('', undefined, 'first', '.vsctestnb');
    // 	await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 	assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
    // 	const editor = vscode.window.activeNotebookEditor!;
    // 	assert.equal(editor.document.cells.length, 1);
    // 	editor.document.metadata.editable = false;
    // 	await editor.edit(builder => builder.delete(0));
    // 	assert.equal(editor.document.cells.length, 1, 'should not delete cell'); // Not editable, no effect
    // 	await editor.edit(builder => builder.insert(0, 'test', 'python', vscode.CellKind.Code, [], undefined));
    // 	assert.equal(editor.document.cells.length, 1, 'should not insert cell'); // Not editable, no effect
    // 	editor.document.metadata.editable = true;
    // 	await editor.edit(builder => builder.delete(0));
    // 	assert.equal(editor.document.cells.length, 0, 'should delete cell'); // Editable, it worked
    // 	await editor.edit(builder => builder.insert(0, 'test', 'python', vscode.CellKind.Code, [], undefined));
    // 	assert.equal(editor.document.cells.length, 1, 'should insert cell'); // Editable, it worked
    // 	// await vscode.commands.executeCommand('workbench.action.files.save');
    // 	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    // });
    test('cell runnable metadata is respected', async () => {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        const editor = vscode.window.activeNotebookEditor;
        await vscode.commands.executeCommand('notebook.focusTop');
        const cell = editor.document.cells[0];
        assert.equal(cell.outputs.length, 0);
        let metadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeCellMetadata);
        cell.metadata.runnable = false;
        await metadataChangeEvent;
        await vscode.commands.executeCommand('notebook.cell.execute');
        assert.equal(cell.outputs.length, 0, 'should not execute'); // not runnable, didn't work
        metadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeCellMetadata);
        cell.metadata.runnable = true;
        await metadataChangeEvent;
        await vscode.commands.executeCommand('notebook.cell.execute');
        assert.equal(cell.outputs.length, 1, 'should execute'); // runnable, it worked
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
    test('document runnable metadata is respected', async () => {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        const editor = vscode.window.activeNotebookEditor;
        const cell = editor.document.cells[0];
        assert.equal(cell.outputs.length, 0);
        let metadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookDocumentMetadata);
        editor.document.metadata.runnable = false;
        await metadataChangeEvent;
        await vscode.commands.executeCommand('notebook.execute');
        assert.equal(cell.outputs.length, 0, 'should not execute'); // not runnable, didn't work
        metadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookDocumentMetadata);
        editor.document.metadata.runnable = true;
        await metadataChangeEvent;
        await vscode.commands.executeCommand('notebook.execute');
        assert.equal(cell.outputs.length, 1, 'should execute'); // runnable, it worked
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
    test('cell execute command takes arguments', async () => {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        const editor = vscode.window.activeNotebookEditor;
        const cell = editor.document.cells[0];
        await vscode.commands.executeCommand('notebook.execute');
        assert.equal(cell.outputs.length, 0, 'should not execute'); // not runnable, didn't work
        const metadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookDocumentMetadata);
        editor.document.metadata.runnable = true;
        await metadataChangeEvent;
        await vscode.commands.executeCommand('notebook.execute');
        assert.equal(cell.outputs.length, 1, 'should execute'); // runnable, it worked
        const clearChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeCellOutputs);
        await vscode.commands.executeCommand('notebook.cell.clearOutputs');
        await clearChangeEvent;
        assert.equal(cell.outputs.length, 0, 'should clear');
        const secondResource = await utils_1.createRandomFile('', undefined, 'second', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', secondResource, 'notebookCoreTest');
        await vscode.commands.executeCommand('notebook.cell.execute', { start: 0, end: 1 }, resource);
        assert.equal(cell.outputs.length, 1, 'should execute'); // runnable, it worked
        assert.equal((_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document.uri.fsPath, secondResource.fsPath);
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
    test('document execute command takes arguments', async () => {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        const editor = vscode.window.activeNotebookEditor;
        const cell = editor.document.cells[0];
        await vscode.commands.executeCommand('notebook.execute');
        assert.equal(cell.outputs.length, 0, 'should not execute'); // not runnable, didn't work
        const metadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookDocumentMetadata);
        editor.document.metadata.runnable = true;
        await metadataChangeEvent;
        await vscode.commands.executeCommand('notebook.execute');
        assert.equal(cell.outputs.length, 1, 'should execute'); // runnable, it worked
        const clearChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeCellOutputs);
        await vscode.commands.executeCommand('notebook.cell.clearOutputs');
        await clearChangeEvent;
        assert.equal(cell.outputs.length, 0, 'should clear');
        const secondResource = await utils_1.createRandomFile('', undefined, 'second', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', secondResource, 'notebookCoreTest');
        await vscode.commands.executeCommand('notebook.execute', resource);
        assert.equal(cell.outputs.length, 1, 'should execute'); // runnable, it worked
        assert.equal((_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document.uri.fsPath, secondResource.fsPath);
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
    test('cell execute and select kernel', async () => {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        const editor = vscode.window.activeNotebookEditor;
        const cell = editor.document.cells[0];
        const metadataChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookDocumentMetadata);
        editor.document.metadata.runnable = true;
        await metadataChangeEvent;
        await vscode.commands.executeCommand('notebook.cell.execute');
        assert.equal(cell.outputs.length, 1, 'should execute'); // runnable, it worked
        assert.deepEqual(cell.outputs[0].data, {
            'text/plain': [
                'my output'
            ]
        });
        await vscode.commands.executeCommand('notebook.selectKernel', { extension: 'vscode.vscode-notebook-tests', id: 'secondaryKernel' });
        await vscode.commands.executeCommand('notebook.cell.execute');
        assert.equal(cell.outputs.length, 1, 'should execute'); // runnable, it worked
        assert.deepEqual(cell.outputs[0].data, {
            'text/plain': [
                'my second output'
            ]
        });
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
});
suite('notebook dirty state', () => {
    test('notebook open', async function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), 'test');
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        assert.equal((_c = vscode.window.activeNotebookEditor.selection) === null || _c === void 0 ? void 0 : _c.document.getText(), '');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
        const activeCell = vscode.window.activeNotebookEditor.selection;
        assert.notEqual(vscode.window.activeNotebookEditor.selection, undefined);
        assert.equal(activeCell.document.getText(), '');
        assert.equal(vscode.window.activeNotebookEditor.document.cells.length, 3);
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 1);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(activeCell.uri, new vscode.Position(0, 0), 'var abc = 0;');
        await vscode.workspace.applyEdit(edit);
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true);
        assert.equal(((_d = vscode.window.activeNotebookEditor) === null || _d === void 0 ? void 0 : _d.selection) !== undefined, true);
        assert.deepEqual((_e = vscode.window.activeNotebookEditor) === null || _e === void 0 ? void 0 : _e.document.cells[1], (_f = vscode.window.activeNotebookEditor) === null || _f === void 0 ? void 0 : _f.selection);
        assert.equal((_h = (_g = vscode.window.activeNotebookEditor) === null || _g === void 0 ? void 0 : _g.selection) === null || _h === void 0 ? void 0 : _h.document.getText(), 'var abc = 0;');
        await saveFileAndCloseAll(resource);
    });
});
suite('notebook undo redo', () => {
    test('notebook open', async function () {
        var _a, _b, _c, _d, _e;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), 'test');
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        assert.equal((_c = vscode.window.activeNotebookEditor.selection) === null || _c === void 0 ? void 0 : _c.document.getText(), '');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
        const activeCell = vscode.window.activeNotebookEditor.selection;
        assert.notEqual(vscode.window.activeNotebookEditor.selection, undefined);
        assert.equal(activeCell.document.getText(), '');
        assert.equal(vscode.window.activeNotebookEditor.document.cells.length, 3);
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 1);
        // modify the second cell, delete it
        const edit = new vscode.WorkspaceEdit();
        edit.insert(vscode.window.activeNotebookEditor.selection.uri, new vscode.Position(0, 0), 'var abc = 0;');
        await vscode.workspace.applyEdit(edit);
        await vscode.commands.executeCommand('notebook.cell.delete');
        assert.equal(vscode.window.activeNotebookEditor.document.cells.length, 2);
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(vscode.window.activeNotebookEditor.selection), 1);
        // undo should bring back the deleted cell, and revert to previous content and selection
        await vscode.commands.executeCommand('undo');
        assert.equal(vscode.window.activeNotebookEditor.document.cells.length, 3);
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(vscode.window.activeNotebookEditor.selection), 1);
        assert.equal((_e = (_d = vscode.window.activeNotebookEditor) === null || _d === void 0 ? void 0 : _d.selection) === null || _e === void 0 ? void 0 : _e.document.getText(), 'var abc = 0;');
        // redo
        // await vscode.commands.executeCommand('notebook.redo');
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells.length, 2);
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells.indexOf(vscode.window.activeNotebookEditor!.selection!), 1);
        // assert.equal(vscode.window.activeNotebookEditor?.selection?.document.getText(), 'test');
        await saveFileAndCloseAll(resource);
    });
    test.skip('execute and then undo redo', async function () {
        var _a, _b;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const cellsChangeEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        const cellChangeEventRet = await cellsChangeEvent;
        assert.equal(cellChangeEventRet.document, (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document);
        assert.equal(cellChangeEventRet.changes.length, 1);
        assert.deepEqual(cellChangeEventRet.changes[0], {
            start: 1,
            deletedCount: 0,
            deletedItems: [],
            items: [
                vscode.window.activeNotebookEditor.document.cells[1]
            ]
        });
        const secondCell = vscode.window.activeNotebookEditor.document.cells[1];
        const moveCellEvent = getEventOncePromise(vscode.notebook.onDidChangeNotebookCells);
        await vscode.commands.executeCommand('notebook.cell.moveUp');
        const moveCellEventRet = await moveCellEvent;
        assert.deepEqual(moveCellEventRet, {
            document: vscode.window.activeNotebookEditor.document,
            changes: [
                {
                    start: 1,
                    deletedCount: 1,
                    deletedItems: [secondCell],
                    items: []
                },
                {
                    start: 0,
                    deletedCount: 0,
                    deletedItems: [],
                    items: [(_b = vscode.window.activeNotebookEditor) === null || _b === void 0 ? void 0 : _b.document.cells[0]]
                }
            ]
        });
        const cellOutputChange = getEventOncePromise(vscode.notebook.onDidChangeCellOutputs);
        await vscode.commands.executeCommand('notebook.cell.execute');
        const cellOutputsAddedRet = await cellOutputChange;
        assert.deepEqual(cellOutputsAddedRet, {
            document: vscode.window.activeNotebookEditor.document,
            cells: [vscode.window.activeNotebookEditor.document.cells[0]]
        });
        assert.equal(cellOutputsAddedRet.cells[0].outputs.length, 1);
        const cellOutputClear = getEventOncePromise(vscode.notebook.onDidChangeCellOutputs);
        await vscode.commands.executeCommand('undo');
        const cellOutputsCleardRet = await cellOutputClear;
        assert.deepEqual(cellOutputsCleardRet, {
            document: vscode.window.activeNotebookEditor.document,
            cells: [vscode.window.activeNotebookEditor.document.cells[0]]
        });
        assert.equal(cellOutputsAddedRet.cells[0].outputs.length, 0);
        await saveFileAndCloseAll(resource);
    });
});
suite('notebook working copy', () => {
    // test('notebook revert on close', async function () {
    // 	const resource = await createRandomFile('', undefined, 'first', '.vsctestnb');
    // 	await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 	await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
    // 	assert.equal(vscode.window.activeNotebookEditor!.selection?.document.getText(), '');
    // 	await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
    // 	await vscode.commands.executeCommand('default:type', { text: 'var abc = 0;' });
    // 	// close active editor from command will revert the file
    // 	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    // 	await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 	assert.equal(vscode.window.activeNotebookEditor !== undefined, true);
    // 	assert.equal(vscode.window.activeNotebookEditor?.selection !== undefined, true);
    // 	assert.deepEqual(vscode.window.activeNotebookEditor?.document.cells[0], vscode.window.activeNotebookEditor?.selection);
    // 	assert.equal(vscode.window.activeNotebookEditor?.selection?.document.getText(), 'test');
    // 	await vscode.commands.executeCommand('workbench.action.files.save');
    // 	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    // });
    // test('notebook revert', async function () {
    // 	const resource = await createRandomFile('', undefined, 'first', '.vsctestnb');
    // 	await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 	await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
    // 	assert.equal(vscode.window.activeNotebookEditor!.selection?.document.getText(), '');
    // 	await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
    // 	await vscode.commands.executeCommand('default:type', { text: 'var abc = 0;' });
    // 	await vscode.commands.executeCommand('workbench.action.files.revert');
    // 	assert.equal(vscode.window.activeNotebookEditor !== undefined, true);
    // 	assert.equal(vscode.window.activeNotebookEditor?.selection !== undefined, true);
    // 	assert.deepEqual(vscode.window.activeNotebookEditor?.document.cells[0], vscode.window.activeNotebookEditor?.selection);
    // 	assert.deepEqual(vscode.window.activeNotebookEditor?.document.cells.length, 1);
    // 	assert.equal(vscode.window.activeNotebookEditor?.selection?.document.getText(), 'test');
    // 	await vscode.commands.executeCommand('workbench.action.files.saveAll');
    // 	await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // });
    test('multiple tabs: dirty + clean', async function () {
        var _a, _b, _c, _d, _e, _f, _g;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), '');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
        const edit = new vscode.WorkspaceEdit();
        edit.insert(vscode.window.activeNotebookEditor.selection.uri, new vscode.Position(0, 0), 'var abc = 0;');
        await vscode.workspace.applyEdit(edit);
        const secondResource = await utils_1.createRandomFile('', undefined, 'second', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', secondResource, 'notebookCoreTest');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        // make sure that the previous dirty editor is still restored in the extension host and no data loss
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true);
        assert.equal(((_b = vscode.window.activeNotebookEditor) === null || _b === void 0 ? void 0 : _b.selection) !== undefined, true);
        assert.deepEqual((_c = vscode.window.activeNotebookEditor) === null || _c === void 0 ? void 0 : _c.document.cells[1], (_d = vscode.window.activeNotebookEditor) === null || _d === void 0 ? void 0 : _d.selection);
        assert.deepEqual((_e = vscode.window.activeNotebookEditor) === null || _e === void 0 ? void 0 : _e.document.cells.length, 3);
        assert.equal((_g = (_f = vscode.window.activeNotebookEditor) === null || _f === void 0 ? void 0 : _f.selection) === null || _g === void 0 ? void 0 : _g.document.getText(), 'var abc = 0;');
        await saveFileAndCloseAll(resource);
    });
    test('multiple tabs: two dirty tabs and switching', async function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), '');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellAbove');
        const edit = new vscode.WorkspaceEdit();
        edit.insert(vscode.window.activeNotebookEditor.selection.uri, new vscode.Position(0, 0), 'var abc = 0;');
        await vscode.workspace.applyEdit(edit);
        const secondResource = await utils_1.createRandomFile('', undefined, 'second', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', secondResource, 'notebookCoreTest');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.document.getText(), '');
        // switch to the first editor
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true);
        assert.equal(((_c = vscode.window.activeNotebookEditor) === null || _c === void 0 ? void 0 : _c.selection) !== undefined, true);
        assert.deepEqual((_d = vscode.window.activeNotebookEditor) === null || _d === void 0 ? void 0 : _d.document.cells[1], (_e = vscode.window.activeNotebookEditor) === null || _e === void 0 ? void 0 : _e.selection);
        assert.deepEqual((_f = vscode.window.activeNotebookEditor) === null || _f === void 0 ? void 0 : _f.document.cells.length, 3);
        assert.equal((_h = (_g = vscode.window.activeNotebookEditor) === null || _g === void 0 ? void 0 : _g.selection) === null || _h === void 0 ? void 0 : _h.document.getText(), 'var abc = 0;');
        // switch to the second editor
        await vscode.commands.executeCommand('vscode.openWith', secondResource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true);
        assert.equal(((_j = vscode.window.activeNotebookEditor) === null || _j === void 0 ? void 0 : _j.selection) !== undefined, true);
        assert.deepEqual((_k = vscode.window.activeNotebookEditor) === null || _k === void 0 ? void 0 : _k.document.cells[1], (_l = vscode.window.activeNotebookEditor) === null || _l === void 0 ? void 0 : _l.selection);
        assert.deepEqual((_m = vscode.window.activeNotebookEditor) === null || _m === void 0 ? void 0 : _m.document.cells.length, 2);
        assert.equal((_p = (_o = vscode.window.activeNotebookEditor) === null || _o === void 0 ? void 0 : _o.selection) === null || _p === void 0 ? void 0 : _p.document.getText(), '');
        await saveAllFilesAndCloseAll(secondResource);
        // await vscode.commands.executeCommand('workbench.action.files.saveAll');
        // await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('multiple tabs: different editors with same document', async function () {
        var _a, _b, _c, _d;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const firstNotebookEditor = vscode.window.activeNotebookEditor;
        assert.equal(firstNotebookEditor !== undefined, true, 'notebook first');
        assert.equal((_a = firstNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), 'test');
        assert.equal((_b = firstNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        await splitEditor();
        const secondNotebookEditor = vscode.window.activeNotebookEditor;
        assert.equal(secondNotebookEditor !== undefined, true, 'notebook first');
        assert.equal((_c = secondNotebookEditor.selection) === null || _c === void 0 ? void 0 : _c.document.getText(), 'test');
        assert.equal((_d = secondNotebookEditor.selection) === null || _d === void 0 ? void 0 : _d.language, 'typescript');
        assert.notEqual(firstNotebookEditor, secondNotebookEditor);
        assert.equal(firstNotebookEditor === null || firstNotebookEditor === void 0 ? void 0 : firstNotebookEditor.document, secondNotebookEditor === null || secondNotebookEditor === void 0 ? void 0 : secondNotebookEditor.document, 'split notebook editors share the same document');
        assert.notEqual(firstNotebookEditor === null || firstNotebookEditor === void 0 ? void 0 : firstNotebookEditor.asWebviewUri(vscode.Uri.file('./hello.png')), secondNotebookEditor === null || secondNotebookEditor === void 0 ? void 0 : secondNotebookEditor.asWebviewUri(vscode.Uri.file('./hello.png')));
        await saveAllFilesAndCloseAll(resource);
        // await vscode.commands.executeCommand('workbench.action.files.saveAll');
        // await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
});
suite('metadata', () => {
    test('custom metadata should be supported', async function () {
        var _a, _b;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        assert.equal(vscode.window.activeNotebookEditor.document.metadata.custom['testMetadata'], false);
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.metadata.custom['testCellMetadata'], 123);
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        await saveFileAndCloseAll(resource);
    });
    // TODO@rebornix skip as it crashes the process all the time
    test.skip('custom metadata should be supported 2', async function () {
        var _a, _b;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        assert.equal(vscode.window.activeNotebookEditor.document.metadata.custom['testMetadata'], false);
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.metadata.custom['testCellMetadata'], 123);
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        // TODO see #101462
        // await vscode.commands.executeCommand('notebook.cell.copyDown');
        // const activeCell = vscode.window.activeNotebookEditor!.selection;
        // assert.equal(vscode.window.activeNotebookEditor!.document.cells.indexOf(activeCell!), 1);
        // assert.equal(activeCell?.metadata.custom!['testCellMetadata'] as number, 123);
        await saveFileAndCloseAll(resource);
    });
});
suite('regression', () => {
    // test('microsoft/vscode-github-issue-notebooks#26. Insert template cell in the new empty document', async function () {
    // 	assertInitalState();
    // 	await vscode.commands.executeCommand('workbench.action.files.newUntitledFile', { "viewType": "notebookCoreTest" });
    // 	assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
    // 	assert.equal(vscode.window.activeNotebookEditor!.selection?.document.getText(), '');
    // 	assert.equal(vscode.window.activeNotebookEditor!.selection?.language, 'typescript');
    // 	await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // });
    test('#106657. Opening a notebook from markers view is broken ', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const document = (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document;
        const [cell] = document.cells;
        await saveAllFilesAndCloseAll(document.uri);
        assert.strictEqual(vscode.window.activeNotebookEditor, undefined);
        // opening a cell-uri opens a notebook editor
        await vscode.commands.executeCommand('vscode.open', cell.uri, vscode.ViewColumn.Active);
        assert.strictEqual(!!vscode.window.activeNotebookEditor, true);
        assert.strictEqual(vscode.window.activeNotebookEditor.document.uri.toString(), resource.toString());
    });
    test.skip('Cannot open notebook from cell-uri with vscode.open-command', async function () {
        var _a;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        const document = (_a = vscode.window.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.document;
        const [cell] = document.cells;
        await saveAllFilesAndCloseAll(document.uri);
        assert.strictEqual(vscode.window.activeNotebookEditor, undefined);
        // BUG is that the editor opener (https://github.com/microsoft/vscode/blob/8e7877bdc442f1e83a7fec51920d82b696139129/src/vs/editor/browser/services/openerService.ts#L69)
        // removes the fragment if it matches something numeric. For notebooks that's not wanted...
        await vscode.commands.executeCommand('vscode.open', cell.uri);
        assert.strictEqual(vscode.window.activeNotebookEditor.document.uri.toString(), resource.toString());
    });
    test('#97830, #97764. Support switch to other editor types', async function () {
        var _a, _b, _c;
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'empty', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        await vscode.commands.executeCommand('notebook.cell.insertCodeCellBelow');
        const edit = new vscode.WorkspaceEdit();
        edit.insert(vscode.window.activeNotebookEditor.selection.uri, new vscode.Position(0, 0), 'var abc = 0;');
        await vscode.workspace.applyEdit(edit);
        assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
        assert.equal((_a = vscode.window.activeNotebookEditor.selection) === null || _a === void 0 ? void 0 : _a.document.getText(), 'var abc = 0;');
        assert.equal((_b = vscode.window.activeNotebookEditor.selection) === null || _b === void 0 ? void 0 : _b.language, 'typescript');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'default');
        assert.equal((_c = vscode.window.activeTextEditor) === null || _c === void 0 ? void 0 : _c.document.uri.path, resource.path);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    // open text editor, pin, and then open a notebook
    test('#96105 - dirty editors', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'empty', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'default');
        const edit = new vscode.WorkspaceEdit();
        edit.insert(resource, new vscode.Position(0, 0), 'var abc = 0;');
        await vscode.workspace.applyEdit(edit);
        // now it's dirty, open the resource with notebook editor should open a new one
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        assert.notEqual(vscode.window.activeNotebookEditor, undefined, 'notebook first');
        // assert.notEqual(vscode.window.activeTextEditor, undefined);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('#102411 - untitled notebook creation failed', async function () {
        assertInitalState();
        await vscode.commands.executeCommand('workbench.action.files.newUntitledFile', { viewType: 'notebookCoreTest' });
        assert.notEqual(vscode.window.activeNotebookEditor, undefined, 'untitled notebook editor is not undefined');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('#102423 - copy/paste shares the same text buffer', async function () {
        assertInitalState();
        const resource = await utils_1.createRandomFile('', undefined, 'first', '.vsctestnb');
        await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
        let activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(activeCell === null || activeCell === void 0 ? void 0 : activeCell.document.getText(), 'test');
        await vscode.commands.executeCommand('notebook.cell.copyDown');
        await vscode.commands.executeCommand('notebook.cell.edit');
        activeCell = vscode.window.activeNotebookEditor.selection;
        assert.equal(vscode.window.activeNotebookEditor.document.cells.indexOf(activeCell), 1);
        assert.equal(activeCell === null || activeCell === void 0 ? void 0 : activeCell.document.getText(), 'test');
        const edit = new vscode.WorkspaceEdit();
        edit.insert(vscode.window.activeNotebookEditor.selection.uri, new vscode.Position(0, 0), 'var abc = 0;');
        await vscode.workspace.applyEdit(edit);
        assert.equal(vscode.window.activeNotebookEditor.document.cells.length, 2);
        assert.notEqual(vscode.window.activeNotebookEditor.document.cells[0].document.getText(), vscode.window.activeNotebookEditor.document.cells[1].document.getText());
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
});
suite('webview', () => {
    // for web, `asWebUri` gets `https`?
    // test('asWebviewUri', async function () {
    // 	if (vscode.env.uiKind === vscode.UIKind.Web) {
    // 		return;
    // 	}
    // 	const resource = await createRandomFile('', undefined, 'first', '.vsctestnb');
    // 	await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 	assert.equal(vscode.window.activeNotebookEditor !== undefined, true, 'notebook first');
    // 	const uri = vscode.window.activeNotebookEditor!.asWebviewUri(vscode.Uri.file('./hello.png'));
    // 	assert.equal(uri.scheme, 'vscode-webview-resource');
    // 	await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // });
    // 404 on web
    // test('custom renderer message', async function () {
    // 	if (vscode.env.uiKind === vscode.UIKind.Web) {
    // 		return;
    // 	}
    // 	const resource = vscode.Uri.file(join(vscode.workspace.rootPath || '', './customRenderer.vsctestnb'));
    // 	await vscode.commands.executeCommand('vscode.openWith', resource, 'notebookCoreTest');
    // 	const editor = vscode.window.activeNotebookEditor;
    // 	const promise = new Promise(resolve => {
    // 		const messageEmitter = editor?.onDidReceiveMessage(e => {
    // 			if (e.type === 'custom_renderer_initialize') {
    // 				resolve();
    // 				messageEmitter?.dispose();
    // 			}
    // 		});
    // 	});
    // 	await vscode.commands.executeCommand('notebook.cell.execute');
    // 	await promise;
    // 	await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // });
});
//# sourceMappingURL=notebook.test.js.map