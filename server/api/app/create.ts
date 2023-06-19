import { v4 as uuidv4 } from 'uuid';

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  let appList: any = await useStorage().getItem('redis:appList')
  let appMap = appList ? new Map(appList) : new Map()

  if(body.name && appMap.has(body.name)) {
    return {
      code: 0,
      data: null,
      message: '应用名称已被注册，请重新创建！'
    }
  } else {
    const uuid = uuidv4()
    appMap.set(body.name, {
      ...body,
      uuid,
      version: '0.0.0',
      createTime: new Date().getTime(),
      checksum: '',
      isDelete: false
    })

    await useStorage().setItem('redis:appList', Array.from(appMap))
    await useStorage().setItem(`redis:${uuid}-appInfo`, appMap.get(body.name))

    return {
      code: 200,
      data: null,
      message: '创建成功！'
    }
  }
})
