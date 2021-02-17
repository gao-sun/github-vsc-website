"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
require("mocha");
const vscode_1 = require("vscode");
const url_1 = require("../util/url");
suite('urlToUri', () => {
    test('Absolute File', () => {
        assert_1.deepStrictEqual(url_1.urlToUri('file:///root/test.txt', vscode_1.Uri.parse('file:///usr/home/')), vscode_1.Uri.parse('file:///root/test.txt'));
    });
    test('Relative File', () => {
        assert_1.deepStrictEqual(url_1.urlToUri('./file.ext', vscode_1.Uri.parse('file:///usr/home/')), vscode_1.Uri.parse('file:///usr/home/file.ext'));
    });
    test('Http Basic', () => {
        assert_1.deepStrictEqual(url_1.urlToUri('http://example.org?q=10&f', vscode_1.Uri.parse('file:///usr/home/')), vscode_1.Uri.parse('http://example.org?q=10&f'));
    });
    test('Http Encoded Chars', () => {
        assert_1.deepStrictEqual(url_1.urlToUri('http://example.org/%C3%A4', vscode_1.Uri.parse('file:///usr/home/')), vscode_1.Uri.parse('http://example.org/%C3%A4'));
    });
});
//# sourceMappingURL=urlToUri.test.js.map