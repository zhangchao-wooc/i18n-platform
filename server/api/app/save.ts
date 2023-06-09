import CryptoJS from 'crypto-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  let currentAppInfo: any = await useStorage().getItem(`redis:${body.uuid}-appInfo`) || {}

  if(Object.keys(currentAppInfo).length === 0) {
    return {
      code: 0,
      data: null,
      message: '应用不存在！'
    }
  } else {
    let appList: any = await useStorage().getItem('redis:appList') || {}
    const checksum = CryptoJS.SHA1(body.data).toString()
    currentAppInfo.checksum = checksum

    appList[currentAppInfo.name] = currentAppInfo

    await useStorage().setItem(`redis:${body.uuid}-current`, body.data)
    await useStorage().setItem('redis:appList', appList)
    await useStorage().setItem(`redis:${body.uuid}-appInfo`, currentAppInfo)

    return {
      code: 200,
      data: null,
      message: ''
    }
  }
})
