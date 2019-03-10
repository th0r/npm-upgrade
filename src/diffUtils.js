import {major} from 'semver';

export function getModuleDiffUrl(name, from, to) {
  if (major(from) === major(to)) {
    return `https://diff.intrinsic.com/${name}/${from}/${to}`;
  }
}
