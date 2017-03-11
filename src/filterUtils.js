import _ from 'lodash';

export function globToRegexp(glob, flags) {
  const regexp = glob
    .split(/\*+/)
    .map(_.escapeRegExp)
    .join('.*?');

  return new RegExp(`^${regexp}$`, flags);
}

export function makeFilterFunction(filterStr = '') {
  let [excludeFilters, includeFilters] = _(filterStr)
    .split(/\s+/)
    .compact()
    .partition(filter => filter[0] === '!')
    .valueOf();

  if (!includeFilters.length) {
    includeFilters.push('*');
  }

  includeFilters = _(includeFilters)
    .map(filter => globToRegexp(filter, 'i'))
    .map(filterRegexp => str => filterRegexp.test(str));

  excludeFilters = _(excludeFilters)
    .map(filter => globToRegexp(filter.slice(1), 'i'))
    .map(filterRegexp => str => filterRegexp.test(str));

  return str => excludeFilters.every(filter => !filter(str)) && includeFilters.some(filter => filter(str));
}
