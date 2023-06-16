export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)
  console.log(JSON.stringify(query))

  const result = await useStorage().getItem('redis:appList') || {}

  if(method === 'DELETE') {
    if(result[query.name] !== undefined) {
      delete result[query.name]
      console.log(JSON.stringify(result))
      await useStorage().setItem('redis:appList', result)
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
      data: result,
      message: ''
    }
  }
})
