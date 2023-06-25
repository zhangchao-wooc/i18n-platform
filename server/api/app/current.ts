export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  const currentAppInfo: any = await useStorage().getItem(`redis:${query.uuid}-appInfo`) || {}
  const currentAppData = await useStorage().getItem(`redis:${query.uuid}-current`) || {}

  if(Object.keys(currentAppInfo).length === 0) {
    return {
      code: 0,
      data: null,
      message: '应用不存在！'
    }
  } else if(currentAppData) {
    console.log('return')
    return {
      code: 200,
      data: currentAppData,
      message: ''
    }
  } else {
    return {
      code: 0,
      data: null,
      message: '应用数据不存在！'
    }
  }
})
