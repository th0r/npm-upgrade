import { parse as parseUrl } from 'url';

import Bluebird from 'bluebird';
import _ from 'lodash';
import got from 'got';

import { getModuleInfo } from './packageUtils';

const CHANGELOG_URL_BUILDERS = {
    'github.com': repositoryUrl => {
        const moduleId = /^(.+?\/.+?)(?:\/|\.|$)/.exec(repositoryUrl.pathname.slice(1))[1];
        const rootUrl = `https://github.com/${moduleId}/blob/master`;

        return {
            builder: changelogFileName => `${rootUrl}/${changelogFileName}`,
            releasesUrl: `https://github.com/${moduleId}/releases`
        };
    }
};

const COMMON_CHANGELOG_FILES = ['CHANGELOG.md', 'History.md', 'CHANGES.md'];

function getChangelogUrlsForRepository(repositoryUrl) {
    const parsedUrl = parseUrl(repositoryUrl);

    if (_.has(CHANGELOG_URL_BUILDERS, parsedUrl.hostname)) {
        const { builder, releasesUrl } = CHANGELOG_URL_BUILDERS[parsedUrl.hostname](parsedUrl);

        return {
            possibleUrls: _.map(COMMON_CHANGELOG_FILES, builder),
            releasesUrl
        };
    } else {
        return null;
    }
}

export const fetchRemoteDb = _.memoize(async url => {
    try {
        const response = await got(url, { json: true });

        return response.body;
    } catch (err) {
        return null;
    }
});

export async function findModuleChangelogUrl(moduleName, remoteChangelogUrlsDbUrl) {
    let changelogUrls;

    if (remoteChangelogUrlsDbUrl) {
        changelogUrls = await fetchRemoteDb(remoteChangelogUrlsDbUrl);
    }

    changelogUrls = changelogUrls || require('../db/changelogUrls.json');

    if (changelogUrls[moduleName]) {
        return changelogUrls[moduleName];
    }

    const { changelog, repository } = await getModuleInfo(moduleName);

    if (changelog) {
        return changelog;
    }

    if (repository && repository.url) {
        // If repository is located on one of known hostings, then we will try to request
        // some common changelog files from there or return URL or "Releases" page
        const changelogUrls = getChangelogUrlsForRepository(repository.url);

        if (changelogUrls) {
            try {
                return await Bluebird.any(
                    _.map(changelogUrls.possibleUrls, url =>
                        Bluebird
                            .try(() => got(url))
                            .return(url)
                    )
                );
            } catch (err) {
                if (!(err instanceof Bluebird.AggregateError)) throw err;
            }

            const { releasesUrl } = changelogUrls;

            if (releasesUrl) {
                try {
                    // Checking `releasesUrl`...
                    await got(releasesUrl);
                    // `releasesUrl` is fine
                    return releasesUrl;
                } catch (err) {
                    // `releasesUrl` is broken
                }
            }
        }
    }

    return null;
}
