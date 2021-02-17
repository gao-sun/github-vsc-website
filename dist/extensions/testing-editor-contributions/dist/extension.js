(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestingEditorServices = exports.activate = void 0;
const vscode = __webpack_require__(1);
const nls = __webpack_require__(2);
const localize = nls.loadMessageBundle();
function activate(context) {
    const diagnostics = vscode.languages.createDiagnosticCollection();
    const services = new TestingEditorServices(diagnostics);
    context.subscriptions.push(services, diagnostics, vscode.languages.registerCodeLensProvider({ scheme: 'file' }, services));
}
exports.activate = activate;
class TestingConfig {
    constructor() {
        this.section = vscode.workspace.getConfiguration("testing" /* ConfigSection */);
        this.changeEmitter = new vscode.EventEmitter();
        this.listener = vscode.workspace.onDidChangeConfiguration(evt => {
            if (evt.affectsConfiguration("testing" /* ConfigSection */)) {
                this.section = vscode.workspace.getConfiguration("testing" /* ConfigSection */);
                this.changeEmitter.fire();
            }
        });
        this.onChange = this.changeEmitter.event;
    }
    get codeLens() {
        return this.section.get("enableCodeLens" /* EnableCodeLensConfig */, true);
    }
    get diagnostics() {
        return this.section.get("enableProblemDiagnostics" /* EnableDiagnosticsConfig */, false);
    }
    get isEnabled() {
        return this.codeLens || this.diagnostics;
    }
    dispose() {
        this.listener.dispose();
    }
}
class TestingEditorServices {
    constructor(diagnostics) {
        this.diagnostics = diagnostics;
        this.codeLensChangeEmitter = new vscode.EventEmitter();
        this.documents = new Map();
        this.config = new TestingConfig();
        this.wasEnabled = this.config.isEnabled;
        /**
         * @inheritdoc
         */
        this.onDidChangeCodeLenses = this.codeLensChangeEmitter.event;
        this.disposables = [
            new vscode.Disposable(() => this.expireAll()),
            this.config,
            vscode.window.onDidChangeVisibleTextEditors((editors) => {
                if (!this.config.isEnabled) {
                    return;
                }
                const expiredEditors = new Set(this.documents.keys());
                for (const editor of editors) {
                    const key = editor.document.uri.toString();
                    this.ensure(key, editor.document);
                    expiredEditors.delete(key);
                }
                for (const expired of expiredEditors) {
                    this.expire(expired);
                }
            }),
            vscode.workspace.onDidCloseTextDocument((document) => {
                this.expire(document.uri.toString());
            }),
            this.config.onChange(() => {
                if (!this.wasEnabled || this.config.isEnabled) {
                    this.attachToAllVisible();
                }
                else if (this.wasEnabled || !this.config.isEnabled) {
                    this.expireAll();
                }
                this.wasEnabled = this.config.isEnabled;
                this.codeLensChangeEmitter.fire();
            }),
        ];
        if (this.config.isEnabled) {
            this.attachToAllVisible();
        }
    }
    /**
     * @inheritdoc
     */
    provideCodeLenses(document) {
        var _a, _b;
        if (!this.config.codeLens) {
            return [];
        }
        return (_b = (_a = this.documents.get(document.uri.toString())) === null || _a === void 0 ? void 0 : _a.provideCodeLenses()) !== null && _b !== void 0 ? _b : [];
    }
    /**
     * Attach to all currently visible editors.
     */
    attachToAllVisible() {
        for (const editor of vscode.window.visibleTextEditors) {
            this.ensure(editor.document.uri.toString(), editor.document);
        }
    }
    /**
     * Unattaches to all tests.
     */
    expireAll() {
        for (const observer of this.documents.values()) {
            observer.dispose();
        }
        this.documents.clear();
    }
    /**
     * Subscribes to tests for the document URI.
     */
    ensure(key, document) {
        const state = this.documents.get(key);
        if (!state) {
            const observer = new DocumentTestObserver(document, this.diagnostics, this.config);
            this.documents.set(key, observer);
            observer.onDidChangeCodeLenses(() => this.config.codeLens && this.codeLensChangeEmitter.fire());
        }
    }
    /**
     * Expires and removes the watcher for the document.
     */
    expire(key) {
        const observer = this.documents.get(key);
        if (!observer) {
            return;
        }
        observer.dispose();
        this.documents.delete(key);
    }
    /**
     * @override
     */
    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.TestingEditorServices = TestingEditorServices;
class DocumentTestObserver {
    constructor(document, diagnostics, config) {
        this.document = document;
        this.diagnostics = diagnostics;
        this.config = config;
        this.codeLensChangeEmitter = new vscode.EventEmitter();
        this.observer = vscode.test.createDocumentTestObserver(this.document);
        this.onDidChangeCodeLenses = this.codeLensChangeEmitter.event;
        this.didHaveDiagnostics = this.config.diagnostics;
        this.disposables = [
            this.observer,
            this.codeLensChangeEmitter,
            config.onChange(() => {
                if (this.didHaveDiagnostics && !config.diagnostics) {
                    this.diagnostics.set(document.uri, []);
                }
                else if (!this.didHaveDiagnostics && config.diagnostics) {
                    this.updateDiagnostics();
                }
                this.didHaveDiagnostics = config.diagnostics;
            }),
            this.observer.onDidChangeTest(() => {
                this.updateDiagnostics();
                this.codeLensChangeEmitter.fire();
            }),
        ];
    }
    updateDiagnostics() {
        var _a;
        if (!this.config.diagnostics) {
            return;
        }
        const uriString = this.document.uri.toString();
        const diagnostics = [];
        for (const test of iterateOverTests(this.observer.tests)) {
            for (const message of test.state.messages) {
                if (((_a = message.location) === null || _a === void 0 ? void 0 : _a.uri.toString()) === uriString) {
                    diagnostics.push({
                        range: message.location.range,
                        message: message.message.toString(),
                        severity: testToDiagnosticSeverity(message.severity),
                    });
                }
            }
        }
        this.diagnostics.set(this.document.uri, diagnostics);
    }
    provideCodeLenses() {
        const lenses = [];
        for (const test of iterateOverTests(this.observer.tests)) {
            const { debuggable = false, runnable = true } = test;
            if (!test.location || !(debuggable || runnable)) {
                continue;
            }
            const summary = summarize(test);
            lenses.push({
                isResolved: true,
                range: test.location.range,
                command: {
                    title: `$(${testStateToIcon[summary.computedState]}) ${getLabelFor(test, summary)}`,
                    command: 'vscode.runTests',
                    arguments: [[test]],
                    tooltip: localize('tooltip.debug', 'Debug {0}', test.label),
                },
            });
            if (debuggable) {
                lenses.push({
                    isResolved: true,
                    range: test.location.range,
                    command: {
                        title: localize('action.debug', 'Debug'),
                        command: 'vscode.debugTests',
                        arguments: [[test]],
                        tooltip: localize('tooltip.debug', 'Debug {0}', test.label),
                    },
                });
            }
        }
        return lenses;
    }
    /**
     * @override
     */
    dispose() {
        this.diagnostics.set(this.document.uri, []);
        this.disposables.forEach(d => d.dispose());
    }
}
function getLabelFor(test, summary) {
    if (summary.duration !== undefined) {
        return localize('tooltip.runStateWithDuration', '{0}/{1} Tests Passed in {2}', summary.passed, summary.passed + summary.failed, formatDuration(summary.duration));
    }
    if (summary.passed > 0 || summary.failed > 0) {
        return localize('tooltip.runState', '{0}/{1} Tests Passed', summary.passed, summary.failed);
    }
    if (test.state.runState === vscode.TestRunState.Passed) {
        return test.state.duration !== undefined
            ? localize('state.passedWithDuration', 'Passed in {0}', formatDuration(test.state.duration))
            : localize('state.passed', 'Passed');
    }
    if (isFailedState(test.state.runState)) {
        return localize('state.failed', 'Failed');
    }
    return localize('action.run', 'Run Tests');
}
function formatDuration(duration) {
    if (duration < 1000) {
        return `${Math.round(duration)}ms`;
    }
    if (duration < 100000) {
        return `${(duration / 1000).toPrecision(3)}s`;
    }
    return `${(duration / 1000 / 60).toPrecision(3)}m`;
}
const statePriority = {
    [vscode.TestRunState.Running]: 6,
    [vscode.TestRunState.Queued]: 5,
    [vscode.TestRunState.Errored]: 4,
    [vscode.TestRunState.Failed]: 3,
    [vscode.TestRunState.Passed]: 2,
    [vscode.TestRunState.Skipped]: 1,
    [vscode.TestRunState.Unset]: 0,
};
const maxPriority = (a, b) => statePriority[a] > statePriority[b] ? a : b;
const isFailedState = (s) => s === vscode.TestRunState.Failed || s === vscode.TestRunState.Errored;
function summarize(test) {
    let passed = 0;
    let failed = 0;
    let duration;
    let computedState = test.state.runState;
    const queue = test.children ? [test.children] : [];
    while (queue.length) {
        for (const test of queue.pop()) {
            computedState = maxPriority(computedState, test.state.runState);
            if (test.state.runState === vscode.TestRunState.Passed) {
                passed++;
                if (test.state.duration !== undefined) {
                    duration = test.state.duration + (duration !== null && duration !== void 0 ? duration : 0);
                }
            }
            else if (isFailedState(test.state.runState)) {
                failed++;
                if (test.state.duration !== undefined) {
                    duration = test.state.duration + (duration !== null && duration !== void 0 ? duration : 0);
                }
            }
            if (test.children) {
                queue.push(test.children);
            }
        }
    }
    return { passed, failed, duration, computedState };
}
function* iterateOverTests(tests) {
    const queue = [tests];
    while (queue.length) {
        for (const test of queue.pop()) {
            yield test;
            if (test.children) {
                queue.push(test.children);
            }
        }
    }
}
const testStateToIcon = {
    [vscode.TestRunState.Errored]: 'testing-error-icon',
    [vscode.TestRunState.Failed]: 'testing-failed-icon',
    [vscode.TestRunState.Passed]: 'testing-passed-icon',
    [vscode.TestRunState.Queued]: 'testing-queued-icon',
    [vscode.TestRunState.Skipped]: 'testing-skipped-icon',
    [vscode.TestRunState.Unset]: 'beaker',
    [vscode.TestRunState.Running]: 'loading~spin',
};
const testToDiagnosticSeverity = (severity) => {
    switch (severity) {
        case vscode.TestMessageSeverity.Hint:
            return vscode.DiagnosticSeverity.Hint;
        case vscode.TestMessageSeverity.Information:
            return vscode.DiagnosticSeverity.Information;
        case vscode.TestMessageSeverity.Warning:
            return vscode.DiagnosticSeverity.Warning;
        case vscode.TestMessageSeverity.Error:
        default:
            return vscode.DiagnosticSeverity.Error;
    }
};


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


Object.defineProperty(exports, "__esModule", { value: true });

function format(message, args) {
	let result;
	// if (isPseudo) {
	// 	// FF3B and FF3D is the Unicode zenkaku representation for [ and ]
	// 	message = '\uFF3B' + message.replace(/[aouei]/g, '$&$&') + '\uFF3D';
	// }
	if (args.length === 0) {
		result = message;
	}
	else {
		result = message.replace(/\{(\d+)\}/g, function (match, rest) {
			let index = rest[0];
			let arg = args[index];
			let replacement = match;
			if (typeof arg === 'string') {
				replacement = arg;
			}
			else if (typeof arg === 'number' || typeof arg === 'boolean' || arg === void 0 || arg === null) {
				replacement = String(arg);
			}
			return replacement;
		});
	}
	return result;
}

function localize(key, message) {
	let args = [];
	for (let _i = 2; _i < arguments.length; _i++) {
		args[_i - 2] = arguments[_i];
	}
	return format(message, args);
}

function loadMessageBundle(file) {
	return localize;
}

let MessageFormat;
(function (MessageFormat) {
	MessageFormat["file"] = "file";
	MessageFormat["bundle"] = "bundle";
	MessageFormat["both"] = "both";
})(MessageFormat = exports.MessageFormat || (exports.MessageFormat = {}));
let BundleFormat;
(function (BundleFormat) {
	// the nls.bundle format
	BundleFormat["standalone"] = "standalone";
	BundleFormat["languagePack"] = "languagePack";
})(BundleFormat = exports.BundleFormat || (exports.BundleFormat = {}));

exports.loadMessageBundle = loadMessageBundle;
function config(opts) {
	if (opts) {
		if (isString(opts.locale)) {
			options.locale = opts.locale.toLowerCase();
			options.language = options.locale;
			resolvedLanguage = undefined;
			resolvedBundles = Object.create(null);
		}
		if (opts.messageFormat !== undefined) {
			options.messageFormat = opts.messageFormat;
		}
		if (opts.bundleFormat === BundleFormat.standalone && options.languagePackSupport === true) {
			options.languagePackSupport = false;
		}
	}
	isPseudo = options.locale === 'pseudo';
	return loadMessageBundle;
}
exports.config = config;


/***/ })
/******/ ])));
//# sourceMappingURL=extension.js.map