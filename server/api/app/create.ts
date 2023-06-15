export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  let appList: any = await useStorage().getItem('redis:appList') || {}

  if(body.name && appList[body.name]) {
    return {
      code: 0,
      data: null,
      message: '应用名称已被注册，请重新创建！'
    }
  } else {
    appList[body.name] = body
    await useStorage().setItem('redis:appList', appList)
    return {
      code: 200,
      data: null,
      message: '创建成功！'
    }
  }
})
