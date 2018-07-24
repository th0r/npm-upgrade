import {parse as parseUrl} from 'url';

import _ from 'lodash';

const KNOWN_REPOSITORIES = {
  'github.com': parsedRepositoryUrl => {
    const repositoryId = /^(.+?\/.+?)(?:\/|\.git$|$)/.exec(parsedRepositoryUrl.pathname.slice(1))[1];
    const rootUrl = `https://github.com/${repositoryId}`;

    return {
      repositoryId,
      fileUrlBuilder: filename => `${rootUrl}/blob/master/${filename}`,
      releasesPageUrl: `${rootUrl}/releases`
    };
  }
};

export function getRepositoryInfo(repositoryUrl) {
  const parsedUrl = parseUrl(repositoryUrl);
  const {hostname} = parsedUrl;

  return _.has(KNOWN_REPOSITORIES, hostname) ? KNOWN_REPOSITORIES[hostname](parsedUrl) : null;
}
