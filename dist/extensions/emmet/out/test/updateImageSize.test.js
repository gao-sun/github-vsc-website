"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const assert = require("assert");
const vscode_1 = require("vscode");
const testUtils_1 = require("./testUtils");
const updateImageSize_1 = require("../updateImageSize");
suite('Tests for Emmet actions on html tags', () => {
    teardown(testUtils_1.closeAllEditors);
    test('update image css with multiple cursors in css file', () => {
        const cssContents = `
		.one {
			margin: 10px;
			padding: 10px;
			background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
		}
		.two {
			background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
			height: 42px;
		}
		.three {
			background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
			width: 42px;
		}
	`;
        const expectedContents = `
		.one {
			margin: 10px;
			padding: 10px;
			background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
			width: 1024px;
			height: 1024px;
		}
		.two {
			background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
			width: 1024px;
			height: 1024px;
		}
		.three {
			background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
			height: 1024px;
			width: 1024px;
		}
	`;
        return testUtils_1.withRandomFileEditor(cssContents, 'css', (editor, doc) => {
            editor.selections = [
                new vscode_1.Selection(4, 50, 4, 50),
                new vscode_1.Selection(7, 50, 7, 50),
                new vscode_1.Selection(11, 50, 11, 50)
            ];
            return updateImageSize_1.updateImageSize().then(() => {
                assert.equal(doc.getText(), expectedContents);
                return Promise.resolve();
            });
        });
    });
    test('update image size in css in html file with multiple cursors', () => {
        const htmlWithCssContents = `
		<html>
			<style>
				.one {
					margin: 10px;
					padding: 10px;
					background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
				}
				.two {
					background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
					height: 42px;
				}
				.three {
					background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
					width: 42px;
				}
			</style>
		</html>
	`;
        const expectedContents = `
		<html>
			<style>
				.one {
					margin: 10px;
					padding: 10px;
					background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
					width: 1024px;
					height: 1024px;
				}
				.two {
					background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
					width: 1024px;
					height: 1024px;
				}
				.three {
					background-image: url(https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png);
					height: 1024px;
					width: 1024px;
				}
			</style>
		</html>
	`;
        return testUtils_1.withRandomFileEditor(htmlWithCssContents, 'html', (editor, doc) => {
            editor.selections = [
                new vscode_1.Selection(6, 50, 6, 50),
                new vscode_1.Selection(9, 50, 9, 50),
                new vscode_1.Selection(13, 50, 13, 50)
            ];
            return updateImageSize_1.updateImageSize().then(() => {
                assert.equal(doc.getText(), expectedContents);
                return Promise.resolve();
            });
        });
    });
    test('update image size in img tag in html file with multiple cursors', () => {
        const htmlwithimgtag = `
		<html>
			<img id="one" src="https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png" />
			<img id="two" src="https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png" width="56" />
			<img id="three" src="https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png" height="56" />
		</html>
	`;
        const expectedContents = `
		<html>
			<img id="one" src="https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png" width="1024" height="1024" />
			<img id="two" src="https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png" width="1024" height="1024" />
			<img id="three" src="https://raw.githubusercontent.com/microsoft/vscode/master/resources/linux/code.png" height="1024" width="1024" />
		</html>
	`;
        return testUtils_1.withRandomFileEditor(htmlwithimgtag, 'html', (editor, doc) => {
            editor.selections = [
                new vscode_1.Selection(2, 50, 2, 50),
                new vscode_1.Selection(3, 50, 3, 50),
                new vscode_1.Selection(4, 50, 4, 50)
            ];
            return updateImageSize_1.updateImageSize().then(() => {
                assert.equal(doc.getText(), expectedContents);
                return Promise.resolve();
            });
        });
    });
});
//# sourceMappingURL=updateImageSize.test.js.map