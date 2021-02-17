"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubPushErrorHandler = void 0;
const vscode_1 = require("vscode");
const nls = require("vscode-nls");
const auth_1 = require("./auth");
const localize = nls.loadMessageBundle();
async function handlePushError(repository, remote, refspec, owner, repo) {
    const yes = localize('create a fork', "Create Fork");
    const no = localize('no', "No");
    const answer = await vscode_1.window.showInformationMessage(localize('fork', "You don't have permissions to push to '{0}/{1}' on GitHub. Would you like to create a fork and push to it instead?", owner, repo), yes, no);
    if (answer === no) {
        return;
    }
    const match = /^([^:]*):([^:]*)$/.exec(refspec);
    const localName = match ? match[1] : refspec;
    const remoteName = match ? match[2] : refspec;
    const [octokit, ghRepository] = await vscode_1.window.withProgress({ location: vscode_1.ProgressLocation.Notification, cancellable: false, title: localize('create fork', 'Create GitHub fork') }, async (progress) => {
        progress.report({ message: localize('forking', "Forking '{0}/{1}'...", owner, repo), increment: 33 });
        const octokit = await auth_1.getOctokit();
        // Issue: what if the repo already exists?
        const res = await octokit.repos.createFork({ owner, repo });
        const ghRepository = res.data;
        progress.report({ message: localize('pushing', "Pushing changes..."), increment: 33 });
        // Issue: what if there's already an `upstream` repo?
        await repository.renameRemote(remote.name, 'upstream');
        // Issue: what if there's already another `origin` repo?
        await repository.addRemote('origin', ghRepository.clone_url);
        try {
            await repository.fetch('origin', remoteName);
            await repository.setBranchUpstream(localName, `origin/${remoteName}`);
        }
        catch (_a) {
            // noop
        }
        await repository.push('origin', localName, true);
        return [octokit, ghRepository];
    });
    // yield
    (async () => {
        const openInGitHub = localize('openingithub', "Open In GitHub");
        const createPR = localize('createpr', "Create PR");
        const action = await vscode_1.window.showInformationMessage(localize('done', "The fork '{0}' was successfully created on GitHub.", ghRepository.full_name), openInGitHub, createPR);
        if (action === openInGitHub) {
            await vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse(ghRepository.html_url));
        }
        else if (action === createPR) {
            const pr = await vscode_1.window.withProgress({ location: vscode_1.ProgressLocation.Notification, cancellable: false, title: localize('createghpr', "Creating GitHub Pull Request...") }, async (_) => {
                var _a;
                let title = `Update ${remoteName}`;
                const head = (_a = repository.state.HEAD) === null || _a === void 0 ? void 0 : _a.name;
                if (head) {
                    const commit = await repository.getCommit(head);
                    title = commit.message.replace(/\n.*$/m, '');
                }
                const res = await octokit.pulls.create({
                    owner,
                    repo,
                    title,
                    head: `${ghRepository.owner.login}:${remoteName}`,
                    base: remoteName
                });
                await repository.setConfig(`branch.${localName}.remote`, 'upstream');
                await repository.setConfig(`branch.${localName}.merge`, `refs/heads/${remoteName}`);
                await repository.setConfig(`branch.${localName}.github-pr-owner-number`, `${owner}#${repo}#${pr.number}`);
                return res.data;
            });
            const openPR = localize('openpr', "Open PR");
            const action = await vscode_1.window.showInformationMessage(localize('donepr', "The PR '{0}/{1}#{2}' was successfully created on GitHub.", owner, repo, pr.number), openPR);
            if (action === openPR) {
                await vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse(pr.html_url));
            }
        }
    })();
}
class GithubPushErrorHandler {
    async handlePushError(repository, remote, refspec, error) {
        if (error.gitErrorCode !== "PermissionDenied" /* PermissionDenied */) {
            return false;
        }
        if (!remote.pushUrl) {
            return false;
        }
        const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\.git/i.exec(remote.pushUrl)
            || /^git@github\.com:([^/]+)\/([^/]+)\.git/i.exec(remote.pushUrl);
        if (!match) {
            return false;
        }
        if (/^:/.test(refspec)) {
            return false;
        }
        const [, owner, repo] = match;
        await handlePushError(repository, remote, refspec, owner, repo);
        return true;
    }
}
exports.GithubPushErrorHandler = GithubPushErrorHandler;
//# sourceMappingURL=pushErrorHandler.js.map