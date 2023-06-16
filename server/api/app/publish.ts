import * as semver from 'semver'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  let allAppInfo: any = await useStorage().getItem(`redis:appList`) || {}
  let currentAppInfo: any = await useStorage().getItem(`redis:${body.uuid}-appInfo`) || {}

  if(Object.keys(currentAppInfo).length === 0) {
    return {
      code: 0,
      data: null,
      message: '应用不存在！'
    }
  } else {
    const { name, version } = currentAppInfo
    if(!semver.valid(version)) {
      return {
        code: 0,
        data: null,
        message: '版本号校验失败，请检查版本号。'
      }
    }
    
    const newVersion = semver.inc(version, 'patch')
    currentAppInfo.version = newVersion
    allAppInfo[name].version = newVersion

    await useStorage().setItem(`redis:appList`, allAppInfo)
    await useStorage().setItem(`redis:${body.uuid}-appInfo`, currentAppInfo)
    await useStorage().setItem(`redis:${body.uuid}-current`, body.data)
    await useStorage().setItem(`redis:${body.uuid}-${newVersion}`, body.data)

    return {
      code: 200,
      data: null,
      message: ''
    }
  }
})
