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

export const diffStanderdJsonCode = (oldData: Record<string, any>, newData: Record<string, any>) => {
  const result: Record<string, any> = {};

  for (const lang in newData) {
    result[lang] = diffJson(oldData[lang] || {}, newData[lang]) 
  }

  return result
}

// Filter out "code" for newly added.
export const diffAddCode = (oldData: Record<string, string>, newData: Record<string, string>): Record<string, string> =>  {
  if (Object.prototype.toString.call(oldData) !== '[object Object]') throw 'diffCode: oldData is not Object';
  if (Object.prototype.toString.call(newData) !== '[object Object]') throw 'diffCode: newData is not Object';

  let result: Record<string, string> = {};

  for (const item in newData) {
    if (!oldData.hasOwnProperty(item)) {
      result[item] = newData[item] || ''
    }
  }

  return result;
}

// Filter out "code" for remove.
export const diffRemoveCode = (oldData: Record<string, string>, newData: Record<string, string>): Record<string, string> =>  {
  if (Object.prototype.toString.call(oldData) !== '[object Object]') throw 'diffCode: oldData is not Object';
  if (Object.prototype.toString.call(newData) !== '[object Object]') throw 'diffCode: newData is not Object';

  let result: Record<string, string> = {};

  for (const item in oldData) {
    if (!newData.hasOwnProperty(item)) {
      result[item] = oldData[item] || ''
    }
  }

  return result;
}

// Filter out "code" for changed values.
export const diffChangeValueCode = (oldData: Record<string, string>, newData: Record<string, string>): Record<string, Record<string, string>> =>  {
  if (Object.prototype.toString.call(oldData) !== '[object Object]') throw 'diffCode: oldData is not Object';
  if (Object.prototype.toString.call(newData) !== '[object Object]') throw 'diffCode: newData is not Object';

  let result: Record<string, Record<string, string>> = {};

  for (const item in newData) {
    if (oldData.hasOwnProperty(item)) {
      if(newData[item] !== oldData[item]) {
        result[item] = {
          newValue: newData[item] || '',
          oldValue: oldData[item] || ''
        }
      }
    }
  }

  return result;
}

// Filter out "code" for empty.
export const DiffEmptyValueCode = (data: Record<string, string>): Record<string, string> =>  {
  if (Object.prototype.toString.call(data) !== '[object Object]') throw 'diffCode: oldData is not Object';

  let result: Record<string, string> = {};

  for (const item in data) {
    if (!data[item]) {
      result[item] = data[item]
    }
  }

  return result;
}

// Data diff for same language merge 
export const DiffMergeData = (oldData: Record<string, string>, newData: Record<string, string>): Record<string, any> => {
  return {
    add: diffAddCode(oldData, newData),
    change: diffChangeValueCode(oldData, newData),
    empty: DiffEmptyValueCode(newData)
  }
}
