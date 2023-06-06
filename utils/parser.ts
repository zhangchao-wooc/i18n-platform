// import * as convert from 'xml-js';
// import type { Options } from 'xml-js'

// // parser xml structure to standard json structure
// export const parserXml = (xml: string): Record<string, string> | string => {
//   const xmlJsonString = convert.xml2json(xml, {compact: true, spaces: 4});
//   const xmlJsonObj = JSON.parse(xmlJsonString);
//   try {
//     const result = xmlObjToStandardJson(xmlJsonObj['resources']['string']);
//     return result
//   } catch (error: any) {
//     return error
//   }
// }

// // xml json structure to standard json structure
// const xmlObjToStandardJson = (xmlJsonObj: any[]): Record<string, string> | string => {
//   const newObj: Record<string, string> = {};

//   if(!Array.isArray(xmlJsonObj)) return 'params is not array'

//   xmlJsonObj.forEach(item => {
//     newObj[item['_attributes']['name']] = item['_text'];
//   });
  
//   return newObj;
// };

// /**
//  * convert to xml
//  * {
//  *    data: is standard json structure,
//  *    options: Options.JS2XML
//  * }
//  *
//  */
// export const convertToXml = (data: Record<string, string>, options?: Options.JS2XML): string => {
//   if(!options) {
//     options = {compact: true, ignoreComment: true, spaces: 4}
//   }
//   const xmlStructureObject: any = {
//     resources: {
//       _attributes: {
//         'xmlns:tools': 'http://schemas.android.com/tools',
//         'tools:ignore': 'MissingTranslation',
//       },
//       string: [],
//     }
//   }

//   for(const item in data) {
//     xmlStructureObject['resources']['string'].push({
//       _attributes: {
//         name: item,
//       },
//       _text: data[item],
//     });
//   }

//   const xmlStructure = convert.json2xml(JSON.stringify(xmlStructureObject), options);

//   return xmlStructure
// }

import { isObject, isString } from './tool'

export const xlsx2Json = (data: any[]) => {
  const dataMap: any = {};
  // 取表格第一行作为标准的语言列表, 代表该数据中包含的语言标识组成的数据
  const languageList = Object.keys(data[0]);

  for (const item of data) {
    if (Object.prototype.toString.call(item) === '[object Object]') {
      for (const children in item) {
        if (children !== 'code') {
          // 组装 xml 的 json 结构
          if (!dataMap.hasOwnProperty(children)) {
            dataMap[children] = {};
          }
          dataMap[children][item['code']] = item[children] || '';
        }
      }

      // 如果该行数据有语言为空时，填补对应的语言 code 的值为空字符串，补齐 xlsx 解析时部分语言value为空便不解析，导致数据残缺问题。
      if (Object.keys(item).length < languageList.length) {
        for (const language of languageList) {
          if (language !== 'code') {
            if (!dataMap.hasOwnProperty(language)) {
              dataMap[language] = {};
            }
            dataMap[language][item['code']] = item[language] || undefined;
          }
        }
      }
    }
  }

  return dataMap;
}

/**
 * standerd json structure
 * 
    {
      "de": {
        "code": "value",
        "common.ok": "ok"
      },
      "zh": {
        "code": "value",
        "common.ok": "好的"
      },
    }
 *
 */
export const toStanderdJson = (data: any, fileName: string): Record<string, string> | string => {
  const result: Record<string, any> = {}
  const parserResult = parserJson2FirstLevel(data)
  if (!isObject(parserResult)) return parserResult;

  result[fileName] = parserResult

  return result
}

/**
 * Parsing JSON as a first-level nested structure
 *
 */
export const parserJson2FirstLevel = (data: any, parentKey?: string): Record<string, string> | string => {
  if (!isObject(data)) return 'toStanderdJson: data is not Object;';

  let result: Record<string, string> = {}

  for (const item in data) {
    /**
     * issue
     *   1. Verify that the beginning and end are not spaces;
     *   2. Verify that the beginning and end are not dot;
     */
    if (isString(data[item])) {
      result[parentKey ? `${parentKey}.${item}` : item] = data[item]
    } else if(isObject(data[item])) {
      result = Object.assign(result, parserJson2FirstLevel(data[item], item))
    }
  }

  return result
}


export const table2StanderdJson = (data: any[]): Record<string , any> => {
  const dataMap: any = {};
  // 取表格第一行作为标准的语言列表, 代表该数据中包含的语言标识组成的数据
  const languageList = Object.keys(data[0]);

  for (const item of data) {
    if (Object.prototype.toString.call(item) === '[object Object]') {
      for (const children in item) {
        if (children !== 'code') {
          // 组装 xml 的 json 结构
          if (!dataMap.hasOwnProperty(children)) {
            dataMap[children] = {};
          }
          dataMap[children][item['code']] = item[children] || '';
        }
      }

      // 如果该行数据有语言为空时，填补对应的语言 code 的值为空字符串，补齐 xlsx 解析时部分语言value为空便不解析，导致数据残缺问题。
      if (Object.keys(item).length < languageList.length) {
        for (const language of languageList) {
          if (language !== 'code') {
            if (!dataMap.hasOwnProperty(language)) {
              dataMap[language] = {};
            }
            dataMap[language][item['code']] = item[language] || undefined;
          }
        }
      }
    }
  }
  return dataMap;
}

/**
 * standerd json to table data
 *
 */

export const standerdJson2Table = (standerdJson: Record<string , any>): {
  columns: Record<string, string>[], tableData: Record<string, string>[]
} => {
  let dataIndex = 0
  const columns: Record<string, string>[] = []
  const tableData: Record<string, string>[] = []

  for(const lang in standerdJson) {
    const fileNameIndex = columns.findIndex((item: Record<string, string>) => item.prop === lang )

    // 如果该语言不存在，则新增一列
    if (fileNameIndex === -1) {
      columns.push({
        label: lang,
        prop: lang
      })
    }

    // 文件内容转为 table 数据格式
    for (const children in standerdJson[lang]) {
      if (isObject(tableData[dataIndex])) {
        // 根据已有表格数据的项的 code 去取新增语言数据中相同 code 的 value，如无则为空字符串，以第一次添加的语言为准，对齐 code。
        tableData[dataIndex][lang] = standerdJson[lang][tableData[dataIndex]['code']] || ''
      } else {
        // 如果索引下的值为空，则新增 code
        tableData[dataIndex] = {}
        tableData[dataIndex]['code'] = children
        tableData[dataIndex][lang] = standerdJson[lang][children]
      }
      dataIndex++
    }
    dataIndex = 0
  }

  return {
    columns,
    tableData
  }
}
