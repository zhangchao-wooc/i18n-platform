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
    await useStorage().setItem(`redis:${body.uuid}-current`, body.data)

    return {
      code: 200,
      data: null,
      message: ''
    }
  }
})
