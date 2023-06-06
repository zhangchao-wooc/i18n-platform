/** @format */

// import * as lodash from 'lodash';

interface DiffResultType {
  remove: Record<string, string>[];
  add: Record<string, string>[];
  change: Record<string, string>[];
  empty: Record<string, any>[];
}

/**
 * Supported data structures：{ ok: '好的', cancel: '取消' }
 *
 */

export function diffJson(oldData: Record<string, string>, newData: Record<string, string>) {
  if (Object.prototype.toString.call(oldData) !== '[object Object]') throw 'diffJson: oldData is not Object';
  if (Object.prototype.toString.call(newData) !== '[object Object]') throw 'diffJson: newData is not Object';

  const diffResult: DiffResultType = {remove: [], add: [], change: [], empty: []};

  for (const item in oldData) {
    const emptyObj: any= {};
    if (newData.hasOwnProperty(item)) {
      // value is empty
      if (typeof newData[item] === 'undefined' || newData[item].toString().trim().length === 0) {
        if (!emptyObj.hasOwnProperty(item)) {
          emptyObj[item] = {};
        }
        emptyObj[item]['new'] = newData[item] || '';
      }

      // value is change
      if (newData[item] !== oldData[item]) {
        const obj: any = {};
        obj[item] = {
          old: oldData[item],
          new: newData[item],
        };
        diffResult['change'].push(obj);
      }
    } else {
      // code remove
      const obj: any = {};
      obj[item] = oldData[item];
      diffResult['remove'].push(obj);
    }

    // value is empty
    if (typeof oldData[item] === 'undefined' || oldData[item].toString().trim().length === 0) {
      if (!emptyObj.hasOwnProperty(item)) {
        emptyObj[item] = {};
      }
      emptyObj[item]['old'] = oldData[item] || '';
    }
    if (Object.keys(emptyObj).length > 0) {
      diffResult['empty'].push(emptyObj);
    }
  }

  // add code
  for (const item in newData) {
    if (!oldData.hasOwnProperty(item)) {
      const obj: any = {};
      obj[item] = newData[item];
      diffResult['add'].push(obj);
    }
  }

  return diffResult;
}

// check add code
export const diffCode = (oldData: Record<string, string>, newData: Record<string, string>) => {
  if (Object.prototype.toString.call(oldData) !== '[object Object]') throw 'diffCode: oldData is not Object';
  if (Object.prototype.toString.call(newData) !== '[object Object]') throw 'diffCode: newData is not Object';

  const result: Record<string, any> = {
    add: {}
  };

  // add code
  for (const item in newData) {
    if (!oldData.hasOwnProperty(item)) {
      result['add'][item] = newData[item]
    }
  }

  return result;
}

export const diffStanderdJsonCode = (oldData: Record<string, any>, newData: Record<string, any>) => {
  const result: Record<string, any> = {};

  const list = Object.keys(oldData)

  for (const lang in newData) {
    for (const item in newData[lang])
    if (!oldData[list[0]].hasOwnProperty(item)) {
      result[lang][item] = newData[lang][item]
    }
  }
}
