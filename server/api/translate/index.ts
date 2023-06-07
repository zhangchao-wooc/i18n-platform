import * as crypto from 'crypto'
import axios from 'axios'

const appid = '20211229001041645';
const appSecret = 'C0w3wfHybAhXspjKR0PU';
const baseUrl = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
const salt = new Date().getTime() + '';

/**
 * translate use baidu
 *
 */
export default defineEventHandler(async (event) => {
  const { value, targetLang, sourceLang } = await readBody(event)

  const result = {
    code: 200,
    message: '',
    data: {}
  }

  const translateResult = await translate(value, sourceLang, targetLang);

  if(typeof translateResult === 'string') {
    result.data = translateResult
  } else {
    result.code = translateResult.error_code
    result.message = translateResult.error_msg
  }
  
  return result
})

const md5 = (text: string) => {
    return crypto.createHash('md5').update(text).digest('hex');
};

const generateSign = (q: string) => {
    return md5(appid + q + salt + appSecret)
}

const translate = async (value: string, sourceLang: string, targetLang: string) => {
  const sign = generateSign(value)
  const result = await axios({
    url: baseUrl, 
    method: 'POST',
    headers: {
      "Content-Type": 'application/x-www-form-urlencoded'
    },
    data: {
      q: value,
      from: sourceLang,
      to: targetLang,
      appid,
      salt,
      sign
    }
  })
  if(!result.data.error_code) {
    return result.data.trans_result[0].dst
  } else {
    return result.data
  }
}

const translateJson = async (langObj: Record<string, string>, sourceLang: string, targetLang: string) => {
  const result: Record<string, string> = {};
  for (const key in langObj) {
    if (langObj.hasOwnProperty(key)) {
      result[key] = await translate(langObj[key], sourceLang, targetLang)
    }
  }
  return result;
};
