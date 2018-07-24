import {resolve} from 'path';
import {writeFileSync} from 'fs';
import del from 'del';

import _ from 'lodash';

const PROJECT_CONFIG_FILENAME = '.npm-upgrade.json';

const path = Symbol('path');
const storedData = Symbol('storedData');
const read = Symbol('read');
const getData = Symbol('getData');

export default class Config {

  constructor(opts) {
    const {projectRoot} = opts || {};
    this[path] = resolve(projectRoot || process.cwd(), PROJECT_CONFIG_FILENAME);
    this[storedData] = this[read]();
    _.assign(
      this,
      _.cloneDeep(this[storedData])
    );
  }

  save() {
    const data = this[getData]();

    if (_.isEqual(data, this[storedData])) return;

    try {
      if (_.isEmpty(data)) {
        this.remove();
      } else {
        writeFileSync(
          this[path],
          JSON.stringify(data, null, 2)
        );
      }
    } catch (err) {
      err.message = `Unable to update npm-upgrade config file: ${err.message}`;
      throw err;
    }
  }

  remove() {
    return del.sync(this[path]);
  }

  [read]() {
    try {
      return require(this[path]);
    } catch (err) {
      return {};
    }
  }

  [getData]() {
    const data = {...this};
    return cleanDeep(data);
  }

}

function cleanDeep(obj) {
  _.each(obj, (val, key) => {
    if (_.isObjectLike(val)) {
      cleanDeep(val);
      if (_.isEmpty(val)) {
        delete obj[key];
      }
    } else if (val === null || val === undefined) {
      delete obj[key];
    }
  });

  return obj;
}
