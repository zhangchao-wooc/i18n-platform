import * as convert from 'xml-js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = {
    code: 200,
    message: '',
    data: {}
  }

  result.data = parserXml(body.fileData)

  return result
})

// parser xml structure to standard json structure
const parserXml = (xml: string): Record<string, string> | string => {
  const xmlJsonString = convert.xml2json(xml, {compact: true, spaces: 4});
  const xmlJsonObj = JSON.parse(xmlJsonString);
  try {
    const result = xmlObjToStandardJson(xmlJsonObj['resources']['string']);
    return result
  } catch (error: any) {
    return error
  }
}

// xml json structure to standard json structure
const xmlObjToStandardJson = (xmlJsonObj: any[]): Record<string, string> | string => {
  const newObj: Record<string, string> = {};

  if(!Array.isArray(xmlJsonObj)) return 'params is not array'

  xmlJsonObj.forEach(item => {
    newObj[item['_attributes']['name']] = item['_text'] || '';
  });
  
  return newObj;
};
