export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)
  const { name } = query

  let appList: any = await useStorage().getItem('redis:appList')
  let appMap = appList ? new Map(appList) : new Map()
  let deletedApp: any = await useStorage().getItem('redis:deletedApp') || {}


  if(method === 'DELETE') {
    if(appMap.has(name)) {
      const deleteAppInfo = appMap.get(name)
      // Current app status change to deleted.
      const newAppInfo = {...deleteAppInfo, isDelete: true}
      deletedApp[`name-${new Date().getTime}`] = newAppInfo
      appMap.delete(name)
      await useStorage().setItem(`redis:${deleteAppInfo.uuid}-appInfo`, {...newAppInfo, isDelete: true})
      await useStorage().setItem('redis:appList', Array.from(appMap))
      await useStorage().setItem('redis:deletedApp', deletedApp)

      return {
        code: 200,
        data: null,
        message: ''
      }
    } else {
      return {
        code: 0,
        data: null,
        message: '应用不存在！'
      }
    }
  } else if(method === 'GET') {
    return {
      code: 200,
      data: Array.from(appMap.values()),
      message: ''
    }
  }
})
