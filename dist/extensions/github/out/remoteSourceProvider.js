"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubRemoteSourceProvider = void 0;
const auth_1 = require("./auth");
const publish_1 = require("./publish");
function parse(url) {
    var _a;
    const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\.git/i.exec(url)
        || /^git@github\.com:([^/]+)\/([^/]+)\.git/i.exec(url);
    return (_a = (match && { owner: match[1], repo: match[2] })) !== null && _a !== void 0 ? _a : undefined;
}
function asRemoteSource(raw) {
    return {
        name: `$(github) ${raw.full_name}`,
        description: raw.description || undefined,
        url: raw.clone_url
    };
}
class GithubRemoteSourceProvider {
    constructor(gitAPI) {
        this.gitAPI = gitAPI;
        this.name = 'GitHub';
        this.icon = 'github';
        this.supportsQuery = true;
        this.userReposCache = [];
    }
    async getRemoteSources(query) {
        const octokit = await auth_1.getOctokit();
        if (query) {
            const repository = parse(query);
            if (repository) {
                const raw = await octokit.repos.get(repository);
                return [asRemoteSource(raw.data)];
            }
        }
        const all = await Promise.all([
            this.getUserRemoteSources(octokit, query),
            this.getQueryRemoteSources(octokit, query)
        ]);
        const map = new Map();
        for (const group of all) {
            for (const remoteSource of group) {
                map.set(remoteSource.name, remoteSource);
            }
        }
        return [...map.values()];
    }
    async getUserRemoteSources(octokit, query) {
        if (!query) {
            const user = await octokit.users.getAuthenticated({});
            const username = user.data.login;
            const res = await octokit.repos.listForUser({ username, sort: 'updated', per_page: 100 });
            this.userReposCache = res.data.map(asRemoteSource);
        }
        return this.userReposCache;
    }
    async getQueryRemoteSources(octokit, query) {
        if (!query) {
            return [];
        }
        const raw = await octokit.search.repos({ q: query, sort: 'updated' });
        return raw.data.items.map(asRemoteSource);
    }
    async getBranches(url) {
        const repository = parse(url);
        if (!repository) {
            return [];
        }
        const octokit = await auth_1.getOctokit();
        const branches = [];
        let page = 1;
        while (true) {
            let res = await octokit.repos.listBranches({ ...repository, per_page: 100, page });
            if (res.data.length === 0) {
                break;
            }
            branches.push(...res.data.map(b => b.name));
            page++;
        }
        const repo = await octokit.repos.get(repository);
        const defaultBranch = repo.data.default_branch;
        return branches.sort((a, b) => a === defaultBranch ? -1 : b === defaultBranch ? 1 : 0);
    }
    publishRepository(repository) {
        return publish_1.publishRepository(this.gitAPI, repository);
    }
}
exports.GithubRemoteSourceProvider = GithubRemoteSourceProvider;
//# sourceMappingURL=remoteSourceProvider.js.map