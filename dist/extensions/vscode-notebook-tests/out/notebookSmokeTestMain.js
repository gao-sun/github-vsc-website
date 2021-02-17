"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.smokeTestActivate = void 0;
const vscode = require("vscode");
const child_process = require("child_process");
const path = require("path");
function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}
function smokeTestActivate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-tests.createNewNotebook', async () => {
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const notebookPath = path.join(workspacePath, 'test.smoke-nb');
        child_process.execSync('echo \'\' > ' + notebookPath);
        await wait(500);
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(notebookPath));
    }));
    context.subscriptions.push(vscode.notebook.registerNotebookContentProvider('notebookSmokeTest', {
        onDidChangeNotebook: new vscode.EventEmitter().event,
        openNotebook: async (_resource) => {
            const dto = {
                languages: ['typescript'],
                metadata: {},
                cells: [
                    {
                        source: 'code()',
                        language: 'typescript',
                        cellKind: vscode.CellKind.Code,
                        outputs: [],
                        metadata: {
                            custom: { testCellMetadata: 123 }
                        }
                    },
                    {
                        source: 'Markdown Cell',
                        language: 'markdown',
                        cellKind: vscode.CellKind.Markdown,
                        outputs: [],
                        metadata: {
                            custom: { testCellMetadata: 123 }
                        }
                    }
                ]
            };
            return dto;
        },
        resolveNotebook: async (_document) => {
            return;
        },
        saveNotebook: async (_document, _cancellation) => {
            return;
        },
        saveNotebookAs: async (_targetResource, _document, _cancellation) => {
            return;
        },
        backupNotebook: async (_document, _context, _cancellation) => {
            return {
                id: '1',
                delete: () => { }
            };
        }
    }));
    const kernel = {
        label: 'notebookSmokeTest',
        isPreferred: true,
        executeAllCells: async (_document) => {
            for (let i = 0; i < _document.cells.length; i++) {
                _document.cells[i].outputs = [{
                        outputKind: vscode.CellOutputKind.Rich,
                        data: {
                            'text/html': ['test output']
                        }
                    }];
            }
        },
        cancelAllCellsExecution: async () => { },
        executeCell: async (_document, _cell) => {
            if (!_cell) {
                _cell = _document.cells[0];
            }
            _cell.outputs = [{
                    outputKind: vscode.CellOutputKind.Rich,
                    data: {
                        'text/html': ['test output']
                    }
                }];
            return;
        },
        cancelCellExecution: async () => { }
    };
    context.subscriptions.push(vscode.notebook.registerNotebookKernelProvider({ filenamePattern: '*.smoke-nb' }, {
        provideKernels: async () => {
            return [kernel];
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('vscode-notebook-tests.debugAction', async (cell) => {
        if (cell) {
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(0, 0, cell.document.lineCount - 1, cell.document.lineAt(cell.document.lineCount - 1).range.end.character);
            edit.replace(cell.document.uri, fullRange, 'test');
            await vscode.workspace.applyEdit(edit);
        }
        else {
            throw new Error('Cell not set correctly');
        }
    }));
}
exports.smokeTestActivate = smokeTestActivate;
//# sourceMappingURL=notebookSmokeTestMain.js.map