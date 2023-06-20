import { validate as uuidValidate } from 'uuid';

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { data, uuid } = body
  const result = {
    code: 0,
    data: null,
    message: '未知错误'
  }

  if(!uuidValidate(body.uuid)) {
    result.message = '应用 id 有误，请检查！'
    return result
  }

  let appList: any = await useStorage().getItem('redis:appList') || {}
  const currentAppInfo: any = await useStorage().getItem(`redis:${uuid}-appInfo`) || {}

  // name is not change.
  if(Reflect.has(appList, data.name) && appList[data.name].uuid !== uuid) {
    // new name is exit, please repeat edit.
    result.message = '应用名称已存在，请重新编辑应用名称！'
    return result
  }

  if(!Reflect.has(appList, data.name) || (Reflect.has(appList, data.name) && appList[data.name].uuid == uuid)) {
    result.code = 200
    let newCurrentAppInfo = {...currentAppInfo, ...data}
    !Reflect.has(appList, data.name) && Reflect.deleteProperty(appList, currentAppInfo.name)
    appList[data.name] = newCurrentAppInfo

    await useStorage().setItem('redis:appList', appList)
    await useStorage().setItem(`redis:${body.uuid}-appInfo`, newCurrentAppInfo)
  }

  return result
})
