import * as XLSX from 'xlsx';

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = {
    code: 200,
    message: '',
    data: {}
  }

  const data = Buffer.concat([new Uint8Array(body)])
  const workbook = XLSX.read(data, { type: 'array'});
  console.log('data', 2, workbook)

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const sheet_to_json = XLSX.utils.sheet_to_json(sheet);
  
  console.log('xlsx', sheet_to_json)

  result.data = parserXlsx(body)

  return result
})

const parserXlsx = (fileData: any): Record<string, string> | string => {
  // console.log('data', fileData)
  const data = new Uint8Array(fileData)
  // console.log('data', 1)
  const workbook = XLSX.read(data, { type: 'array'});
  // console.log('data', 2, workbook)

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const sheet_to_json = XLSX.utils.sheet_to_json(sheet);
  
  console.log('xlsx', sheet_to_json)
  return sheet_to_json
  // const structuralVerification = sheet_to_json.findIndex((item: any) => Object.prototype.toString.call(item) !== '[object Object]') === -1
  // if ( structuralVerification ) {
  //   const result = dealXlsxData(sheet_to_json)
  //   return result
  // } else {
  //   return 'parserXlsx: 请检查文件结构'
  // }
}

const dealXlsxData = (data: any[]) => {
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
