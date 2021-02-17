"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const customTextEditor_1 = require("../customTextEditor");
const utils_1 = require("./utils");
assert.ok(vscode.workspace.rootPath);
const testWorkspaceRoot = vscode.Uri.file(path.join(vscode.workspace.rootPath, 'customEditors'));
const commands = Object.freeze({
    open: 'vscode.open',
    openWith: 'vscode.openWith',
    save: 'workbench.action.files.save',
    undo: 'undo',
});
async function writeRandomFile(options) {
    const fakeFile = utils_1.randomFilePath({ root: testWorkspaceRoot, ext: options.ext });
    await fs.promises.writeFile(fakeFile.fsPath, Buffer.from(options.contents));
    return fakeFile;
}
const disposables = [];
function _register(disposable) {
    disposables.push(disposable);
    return disposable;
}
class CustomEditorUpdateListener {
    constructor() {
        this.unconsumedResponses = [];
        this.callbackQueue = [];
        this.commandSubscription = vscode.commands.registerCommand(customTextEditor_1.Testing.abcEditorContentChangeCommand, (data) => {
            if (this.callbackQueue.length) {
                const callback = this.callbackQueue.shift();
                assert.ok(callback);
                callback(data);
            }
            else {
                this.unconsumedResponses.push(data);
            }
        });
    }
    static create() {
        return _register(new CustomEditorUpdateListener());
    }
    dispose() {
        this.commandSubscription.dispose();
    }
    async nextResponse() {
        if (this.unconsumedResponses.length) {
            return this.unconsumedResponses.shift();
        }
        return new Promise(resolve => {
            this.callbackQueue.push(resolve);
        });
    }
}
suite('CustomEditor tests', () => {
    setup(async () => {
        await utils_1.closeAllEditors();
        await resetTestWorkspace();
    });
    teardown(async () => {
        await utils_1.closeAllEditors();
        utils_1.disposeAll(disposables);
        await resetTestWorkspace();
    });
    test('Should load basic content from disk', async () => {
        const startingContent = `load, init`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        await vscode.commands.executeCommand(commands.open, testDocument);
        const { content } = await listener.nextResponse();
        assert.equal(content, startingContent);
    });
    test('Should support basic edits', async () => {
        const startingContent = `basic edit, init`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        await vscode.commands.executeCommand(commands.open, testDocument);
        await listener.nextResponse();
        const newContent = `basic edit test`;
        await vscode.commands.executeCommand(customTextEditor_1.Testing.abcEditorTypeCommand, newContent);
        const { content } = await listener.nextResponse();
        assert.equal(content, newContent);
    });
    test('Should support single undo', async () => {
        const startingContent = `single undo, init`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        await vscode.commands.executeCommand(commands.open, testDocument);
        await listener.nextResponse();
        const newContent = `undo test`;
        {
            await vscode.commands.executeCommand(customTextEditor_1.Testing.abcEditorTypeCommand, newContent);
            const { content } = await listener.nextResponse();
            assert.equal(content, newContent);
        }
        await utils_1.delay(100);
        {
            await vscode.commands.executeCommand(commands.undo);
            const { content } = await listener.nextResponse();
            assert.equal(content, startingContent);
        }
    });
    test('Should support multiple undo', async () => {
        const startingContent = `multiple undo, init`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        await vscode.commands.executeCommand(commands.open, testDocument);
        await listener.nextResponse();
        const count = 10;
        // Make edits
        for (let i = 0; i < count; ++i) {
            await vscode.commands.executeCommand(customTextEditor_1.Testing.abcEditorTypeCommand, `${i}`);
            const { content } = await listener.nextResponse();
            assert.equal(`${i}`, content);
        }
        // Then undo them in order
        for (let i = count - 1; i; --i) {
            await utils_1.delay(100);
            await vscode.commands.executeCommand(commands.undo);
            const { content } = await listener.nextResponse();
            assert.equal(`${i - 1}`, content);
        }
        {
            await utils_1.delay(100);
            await vscode.commands.executeCommand(commands.undo);
            const { content } = await listener.nextResponse();
            assert.equal(content, startingContent);
        }
    });
    test('Should update custom editor on file move', async () => {
        const startingContent = `file move, init`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        await vscode.commands.executeCommand(commands.open, testDocument);
        await listener.nextResponse();
        const newFileName = vscode.Uri.file(path.join(testWorkspaceRoot.fsPath, 'y.abc'));
        const edit = new vscode.WorkspaceEdit();
        edit.renameFile(testDocument, newFileName);
        await vscode.workspace.applyEdit(edit);
        const response = (await listener.nextResponse());
        assert.equal(response.content, startingContent);
        assert.equal(response.source.toString(), newFileName.toString());
    });
    test('Should support saving custom editors', async () => {
        const startingContent = `save, init`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        await vscode.commands.executeCommand(commands.open, testDocument);
        await listener.nextResponse();
        const newContent = `save, new`;
        {
            await vscode.commands.executeCommand(customTextEditor_1.Testing.abcEditorTypeCommand, newContent);
            const { content } = await listener.nextResponse();
            assert.equal(content, newContent);
        }
        {
            await vscode.commands.executeCommand(commands.save);
            const fileContent = (await fs.promises.readFile(testDocument.fsPath)).toString();
            assert.equal(fileContent, newContent);
        }
    });
    test('Should undo after saving custom editor', async () => {
        const startingContent = `undo after save, init`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        await vscode.commands.executeCommand(commands.open, testDocument);
        await listener.nextResponse();
        const newContent = `undo after save, new`;
        {
            await vscode.commands.executeCommand(customTextEditor_1.Testing.abcEditorTypeCommand, newContent);
            const { content } = await listener.nextResponse();
            assert.equal(content, newContent);
        }
        {
            await vscode.commands.executeCommand(commands.save);
            const fileContent = (await fs.promises.readFile(testDocument.fsPath)).toString();
            assert.equal(fileContent, newContent);
        }
        await utils_1.delay(100);
        {
            await vscode.commands.executeCommand(commands.undo);
            const { content } = await listener.nextResponse();
            assert.equal(content, startingContent);
        }
    });
    test.skip('Should support untitled custom editors', async () => {
        const listener = CustomEditorUpdateListener.create();
        const untitledFile = utils_1.randomFilePath({ root: testWorkspaceRoot, ext: '.abc' }).with({ scheme: 'untitled' });
        await vscode.commands.executeCommand(commands.open, untitledFile);
        assert.equal((await listener.nextResponse()).content, '');
        await vscode.commands.executeCommand(customTextEditor_1.Testing.abcEditorTypeCommand, `123`);
        assert.equal((await listener.nextResponse()).content, '123');
        await vscode.commands.executeCommand(commands.save);
        const content = await fs.promises.readFile(untitledFile.fsPath);
        assert.equal(content.toString(), '123');
    });
    test.skip('When switching away from a non-default custom editors and then back, we should continue using the non-default editor', async () => {
        var _a, _b, _c;
        const startingContent = `switch, init`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        {
            await vscode.commands.executeCommand(commands.open, testDocument, { preview: false });
            const { content } = await listener.nextResponse();
            assert.strictEqual(content, startingContent.toString());
            assert.ok(!vscode.window.activeTextEditor);
        }
        // Switch to non-default editor
        await vscode.commands.executeCommand(commands.openWith, testDocument, 'default', { preview: false });
        assert.strictEqual((_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.toString(), testDocument.toString());
        // Then open a new document (hiding existing one)
        const otherFile = vscode.Uri.file(path.join(testWorkspaceRoot.fsPath, 'other.json'));
        await vscode.commands.executeCommand(commands.open, otherFile);
        assert.strictEqual((_b = vscode.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.document.uri.toString(), otherFile.toString());
        // And then back
        await vscode.commands.executeCommand('workbench.action.navigateBack');
        await vscode.commands.executeCommand('workbench.action.navigateBack');
        // Make sure we have the file on as text
        assert.ok(vscode.window.activeTextEditor);
        assert.strictEqual((_c = vscode.window.activeTextEditor) === null || _c === void 0 ? void 0 : _c.document.uri.toString(), testDocument.toString());
    });
    test('Should release the text document when the editor is closed', async () => {
        const startingContent = `release document init,`;
        const testDocument = await writeRandomFile({ ext: '.abc', contents: startingContent });
        const listener = CustomEditorUpdateListener.create();
        await vscode.commands.executeCommand(commands.open, testDocument);
        await listener.nextResponse();
        const doc = vscode.workspace.textDocuments.find(x => x.uri.toString() === testDocument.toString());
        assert.ok(doc);
        assert.ok(!doc.isClosed);
        await utils_1.closeAllEditors();
        await utils_1.delay(100);
        assert.ok(doc.isClosed);
    });
});
async function resetTestWorkspace() {
    try {
        await vscode.workspace.fs.delete(testWorkspaceRoot, { recursive: true });
    }
    catch (_a) {
        // ok if file doesn't exist
    }
    await vscode.workspace.fs.createDirectory(testWorkspaceRoot);
}
//# sourceMappingURL=customEditor.test.js.map