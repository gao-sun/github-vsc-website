"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const notebookSmokeTestMain_1 = require("./notebookSmokeTestMain");
function activate(context) {
    notebookSmokeTestMain_1.smokeTestActivate(context);
    const _onDidChangeNotebook = new vscode.EventEmitter();
    context.subscriptions.push(_onDidChangeNotebook);
    context.subscriptions.push(vscode.notebook.registerNotebookContentProvider('notebookCoreTest', {
        onDidChangeNotebook: _onDidChangeNotebook.event,
        openNotebook: async (_resource) => {
            if (/.*empty\-.*\.vsctestnb$/.test(_resource.path)) {
                return {
                    languages: ['typescript'],
                    metadata: {},
                    cells: []
                };
            }
            const dto = {
                languages: ['typescript'],
                metadata: {
                    custom: { testMetadata: false }
                },
                cells: [
                    {
                        source: 'test',
                        language: 'typescript',
                        cellKind: vscode.CellKind.Code,
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
        id: 'mainKernel',
        label: 'Notebook Test Kernel',
        isPreferred: true,
        executeAllCells: async (_document) => {
            const cell = _document.cells[0];
            cell.outputs = [{
                    outputKind: vscode.CellOutputKind.Rich,
                    data: {
                        'text/plain': ['my output']
                    }
                }];
            return;
        },
        cancelAllCellsExecution: async (_document) => { },
        executeCell: async (document, cell) => {
            if (!cell) {
                cell = document.cells[0];
            }
            if (document.uri.path.endsWith('customRenderer.vsctestnb')) {
                cell.outputs = [{
                        outputKind: vscode.CellOutputKind.Rich,
                        data: {
                            'text/custom': 'test'
                        }
                    }];
                return;
            }
            const previousOutputs = cell.outputs;
            const newOutputs = [{
                    outputKind: vscode.CellOutputKind.Rich,
                    data: {
                        'text/plain': ['my output']
                    }
                }];
            cell.outputs = newOutputs;
            _onDidChangeNotebook.fire({
                document: document,
                undo: () => {
                    if (cell) {
                        cell.outputs = previousOutputs;
                    }
                },
                redo: () => {
                    if (cell) {
                        cell.outputs = newOutputs;
                    }
                }
            });
            return;
        },
        cancelCellExecution: async (_document, _cell) => { }
    };
    const kernel2 = {
        id: 'secondaryKernel',
        label: 'Notebook Secondary Test Kernel',
        isPreferred: false,
        executeAllCells: async (_document) => {
            const cell = _document.cells[0];
            cell.outputs = [{
                    outputKind: vscode.CellOutputKind.Rich,
                    data: {
                        'text/plain': ['my second output']
                    }
                }];
            return;
        },
        cancelAllCellsExecution: async (_document) => { },
        executeCell: async (document, cell) => {
            if (!cell) {
                cell = document.cells[0];
            }
            if (document.uri.path.endsWith('customRenderer.vsctestnb')) {
                cell.outputs = [{
                        outputKind: vscode.CellOutputKind.Rich,
                        data: {
                            'text/custom': 'test 2'
                        }
                    }];
                return;
            }
            const previousOutputs = cell.outputs;
            const newOutputs = [{
                    outputKind: vscode.CellOutputKind.Rich,
                    data: {
                        'text/plain': ['my second output']
                    }
                }];
            cell.outputs = newOutputs;
            _onDidChangeNotebook.fire({
                document: document,
                undo: () => {
                    if (cell) {
                        cell.outputs = previousOutputs;
                    }
                },
                redo: () => {
                    if (cell) {
                        cell.outputs = newOutputs;
                    }
                }
            });
            return;
        },
        cancelCellExecution: async (_document, _cell) => { }
    };
    context.subscriptions.push(vscode.notebook.registerNotebookKernelProvider({ filenamePattern: '*.vsctestnb' }, {
        provideKernels: async () => {
            return [kernel, kernel2];
        }
    }));
}
exports.activate = activate;
//# sourceMappingURL=notebookTestMain.js.map