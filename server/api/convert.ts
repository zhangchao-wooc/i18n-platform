import * as convert from 'xml-js';
import type { Options } from 'xml-js'

interface ParamsType {
  data: Record<string, any>
  type?: 'json' | 'xml' | 'xlsx',
  scene?: 'DIFF',
  diffType?: 'add' | 'remove' | 'change' | 'empty' | 'all'
}

interface ResponseBodyType {
  code: number
  message: string
  data: any
}

export default defineEventHandler(async (event) => {
  const { data, type = 'json', scene, diffType }: ParamsType = await readBody(event)
  let fielDataStructure: string = ''
  const newData: Record<string, string> = {}
  const result: ResponseBodyType = {
    code: 200,
    message: '',
    data: null
  }

  if ( scene === 'DIFF') {
    if (!diffType) {
      result.code = 0
      result.message = 'params "diffType" cannot be empty when scene is "DIFF"'
      return result
    }
    if (diffType !== 'all') {
      // query diff structure
      if (Array.isArray(data[diffType])) {
        data[diffType].forEach((item: Record<string, string>) => {
          Object.assign(newData, item)
        });
        fielDataStructure = JSON.stringify(newData, null, 4)
      }
    } else {
      fielDataStructure = JSON.stringify(data, null, 4)
    }
  }

  if (type === 'xml') {
    fielDataStructure = convertToXml(data)
  }

  if (type === 'json') {
    fielDataStructure = JSON.stringify(data, null, 4)
  }

  result.data = fielDataStructure

  return result
})

/**
 * convert to xml
 * {
 *    data: is standard json structure,
 *    options: Options.JS2XML
 * }
 *
 */
const convertToXml = (data: Record<string, string>, options?: Options.JS2XML): string => {
  if(!options) {
    options = {compact: true, ignoreComment: true, spaces: 4}
  }
  const xmlStructureObject: any = {
    resources: {
      _attributes: {
        'xmlns:tools': 'http://schemas.android.com/tools',
        'tools:ignore': 'MissingTranslation',
      },
      string: [],
    }
  }

  for(const item in data) {
    xmlStructureObject['resources']['string'].push({
      _attributes: {
        name: item,
      },
      _text: data[item],
    });
  }

  const xmlStructure = convert.json2xml(JSON.stringify(xmlStructureObject), options);

  return xmlStructure
}

