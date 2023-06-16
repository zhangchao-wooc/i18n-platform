export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  let currentAppInfo: any = await useStorage().getItem(`redis:${query.uuid}-appInfo`) || {}

  if(Object.keys(currentAppInfo).length === 0) {
    return {
      code: 0,
      data: null,
      message: '应用不存在！'
    }
  }

  return {
    code: 200,
    data: currentAppInfo,
    message: ''
  }
})
