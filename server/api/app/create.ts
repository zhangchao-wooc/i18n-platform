import { v4 as uuidv4 } from 'uuid';

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
    const uuid = uuidv4()
    appList[body.name] = {
      ...body,
      uuid,
      version: '0.0.0',
      createTime: new Date().getTime()
    }

    await useStorage().setItem('redis:appList', appList)
    await useStorage().setItem(`redis:${uuid}-appInfo`, appList[body.name])

    return {
      code: 200,
      data: null,
      message: '创建成功！'
    }
  }
})
